import VerticalLayout from './VerticalLayout.js'
import ErrorPage from "./ErrorPage.js"
import LoadingPage from "./LoadingPage.js"

import Actions from './Actions.js'

// mapping mois français → chiffres (avec ou sans point)
const monthMap = {
  'Jan': '01', 'Jan.': '01', 'Janvier': '01',
  'Fév': '02', 'Fév.': '02', 'Février': '02',
  'Mar': '03', 'Mar.': '03', 'Mars': '03',
  'Avr': '04', 'Avr.': '04', 'Avril': '04',
  'Mai': '05', 'Mai.': '05',
  'Juin': '06',
  'Juil': '07', 'Juil.': '07', 'Juillet': '07',
  'Aoû': '08', 'Aoû.': '08', 'Août': '08',
  'Sep': '09', 'Sep.': '09', 'Septembre': '09',
  'Oct': '10', 'Oct.': '10', 'Octobre': '10',
  'Nov': '11', 'Nov.': '11', 'Novembre': '11',
  'Déc': '12', 'Déc.': '12', 'Décembre': '12'
}

// Fonction robuste qui parse une date française vers un objet Date JS
function parseFrenchDate(str) {
  const [day, rawMonthStr, year] = str.trim().split(' ')
  const monthStr = rawMonthStr.trim().replace('.', '') // enlève le point
  const normalizedMonth = Object.keys(monthMap).find(key => key.startsWith(monthStr))
  if (!normalizedMonth) {
    console.warn(`⚠️ Mois invalide pour la date : "${str}" (mois reçu : "${monthStr}")`)
    return new Date(0) // date très ancienne
  }
  const month = monthMap[normalizedMonth]
  const fullYear = year.length === 2 ? `20${year}` : year
  return new Date(`${fullYear}-${month}-${day.padStart(2, '0')}`)
}

// HTML d'une ligne de tableau
const row = (bill) => {
  return (`
    <tr>
      <td>${bill.type}</td>
      <td>${bill.name}</td>
      <td>${bill.date}</td>
      <td>${bill.amount} €</td>
      <td>${bill.status}</td>
      <td>
        ${Actions(bill.fileUrl)}
      </td>
    </tr>
    `)
  }

// Génère les lignes de tableau triées
const rows = (data) => {
  // console.log("Données reçues :", data);

  if (!data || !data.length) {
    return "";
  }

  const validData = data.filter(bill => bill.date !== "1 Jan. 70")
  // console.log("Données valides (sans 1 Jan. 70) :", validData);

  const sorted = [...validData].sort((a, b) => {
    const dateA = parseFrenchDate(a.date)
    const dateB = parseFrenchDate(b.date)
    return dateB - dateA // plus récent en haut
  })
  // console.log("Données triées (du plus récent au plus ancien) :", sorted)

  return sorted.map(bill => row(bill)).join("")
}

// Vue principale
export default ({ data: bills, loading, error }) => {
  
  const modal = () => (`
    <div data-testid="modaleFile" class="modal fade" id="modaleFile" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLongTitle">Justificatif</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
          </div>
        </div>
      </div>
    </div>
  `)

  if (loading) {
    return LoadingPage()
  } else if (error) {
    return ErrorPage(error)
  }
  
  return (`
    <div class='layout'>
      ${VerticalLayout(120)}
      <div class='content'>
        <div class='content-header'>
          <div class='content-title'> Mes notes de frais </div>
          <button type="button" data-testid='btn-new-bill' class="btn btn-primary">Nouvelle note de frais</button>
        </div>
        <div id="data-table">
        <table id="example" class="table table-striped" style="width:100%">
          <thead>
              <tr>
                <th>Type</th>
                <th>Nom</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
          </thead>
          <tbody data-testid="tbody">
            ${rows(bills)}
          </tbody>
          </table>
        </div>
      </div>
      ${modal()}
    </div>`
  )
}