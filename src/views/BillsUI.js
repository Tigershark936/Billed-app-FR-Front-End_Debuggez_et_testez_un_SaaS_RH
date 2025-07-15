import VerticalLayout from './VerticalLayout.js'
import ErrorPage from "./ErrorPage.js"
import LoadingPage from "./LoadingPage.js"
import Actions from './Actions.js'

// Mapping mois FR → chiffres
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

/**
 * Parse une date au format français ("04 Avril 2022") ou ISO ("2022-04-04")
 * Retourne un objet Date JavaScript valide, ou Date(0) si invalide
 */
function parseFrenchDate(str) {
  // Si la chaîne est vide ou n'est pas une chaîne, retourne une date "0" (date invalide)
  if (!str || typeof str !== 'string') return new Date(0)
  // Si la date est au format ISO standard "yyyy-mm-dd", on crée directement un objet Date
  if (/^\d{4}-\d{2}-\d{2}$/.test(str.trim())) {
    return new Date(str.trim())
  }

  // Sinon, on tente de parser une date au format français "dd mois yyyy"
  const parts = str.trim().split(' ')
  // Si la chaîne ne contient pas exactement 3 parties (jour, mois, année), on retourne date invalide
  if (parts.length !== 3) return new Date(0)

  // On récupère les parties jour, mois brut (avec ou sans point), et année
  const [day, rawMonthStr, year] = parts
  // On enlève un éventuel point à la fin du mois (ex: "Nov." → "Nov")
  const monthStr = rawMonthStr.replace('.', '')
  // On cherche dans la map des mois une clé qui commence par la chaîne mois (ex: "Nov" matchera "Novembre")
  const normalizedMonth = Object.keys(monthMap).find(k => k.startsWith(monthStr))

  // Si aucun mois valide n'est trouvé, on retourne date invalide
  if (!normalizedMonth) return new Date(0)

  // On récupère le numéro du mois correspondant à la clé trouvée
  const month = monthMap[normalizedMonth]
  // Si l'année est sur 2 chiffres, on la transforme en année sur 4 chiffres (ex: "22" → "2022")
  const fullYear = year.length === 2 ? `20${year}` : year

  // On construit la date au format ISO "yyyy-mm-dd" puis on crée un objet Date JavaScript
  return new Date(`${fullYear}-${month}-${day.padStart(2, '0')}`)
}

/**
 * Génère une ligne tableau HTML pour une facture.
 */
const row = (bill) => `
  <tr>
    <td>${bill.type}</td>
    <td>${bill.name}</td>
    <td>${bill.date || ''}</td>
    <td>${bill.amount} €</td>
    <td>${bill.status}</td>
    <td>${Actions(bill.fileUrl)}</td>
  </tr>
`

/**
 * Filtre strict des factures valides, excluant les dates avec timestamp <= 1 jour en ms
 */
const isValidBillDate = (dateStr) => {
  // Vérifie que la date existe, est une chaîne non vide, sinon retourne false
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.trim()) return false

  // Parse la date en objet Date JavaScript
  const date = parseFrenchDate(dateStr)

  // Récupère le timestamp en millisecondes depuis Epoch (1er janvier 1970)
  const timestamp = date.getTime()

  // Exclut les dates invalides (NaN)
  if (isNaN(timestamp)) return false
  // Exclut les dates trop anciennes (timestamp inférieur ou égal à 1 jour en ms)
  if (timestamp <= 86400000) return false
  // Exclut les dates dans le futur par rapport à la date actuelle
  if (timestamp > Date.now()) return false

  // Si toutes les conditions sont bonnes, retourne true (date valide)
  return true
}

/**
 * Génère les lignes du tableau triées par date décroissante.
 * Filtre strictement les factures sans date valide.
 */
const rows = (data) => {
  // Si aucune donnée ou tableau vide, on retourne une chaîne vide (pas de lignes)
  if (!data?.length) return ""

  // Filtre strict des factures dont la date est valide (timestamp > 1 jour)
  const validData = data.filter(bill => isValidBillDate(bill?.date))

  // Si aucune facture valide après filtrage, on retourne une ligne indiquant l'absence de factures valides
  if (validData.length === 0) {
    return `<tr><td colspan="6" style="text-align:center;">Aucune facture valide</td></tr>`
  }

  // Trie les factures valides par date décroissante (du plus récent au plus ancien)
  const sorted = [...validData].sort(
    (a, b) => parseFrenchDate(b.date).getTime() - parseFrenchDate(a.date).getTime()
  )

  // Génère et concatène les lignes HTML du tableau à partir des factures triées
  return sorted.map(bill => row(bill)).join("")
}

/**
 * Composant principal BillsUI
 * Affiche les factures triées, ou page chargement / erreur.
 */
export default ({ data: bills, loading, error }) => {
  const modal = () => `
    <div data-testid="modaleFile" class="modal fade" id="modaleFile" tabindex="-1" role="dialog" aria-labelledby="modalTitle" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="modalTitle">Justificatif</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body"></div>
        </div>
      </div>
    </div>
  `
  // Si la page est en cours de chargement, affiche le composant de chargement (LoadingPage)
  if (loading) return LoadingPage()
  
  // Si une erreur est présente, affiche la page d'erreur avec le message correspondant
  if (error) return ErrorPage(error)

  return `
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
    </div>
  `
}