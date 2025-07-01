import { formatDate } from '../app/format.js'
import DashboardFormUI from '../views/DashboardFormUI.js'
import BigBilledIcon from '../assets/svg/big_billed.js'
import { ROUTES_PATH } from '../constants/routes.js'
import USERS_TEST from '../constants/usersTest.js'
import Logout from "./Logout.js"

// Filtre les factures selon le statut demandé
export const filteredBills = (data, status) => {
  return (data && data.length) ?
    data.filter(bill => {
      let selectCondition

      // in jest environment
      if (typeof jest !== 'undefined') {
        selectCondition = (bill.status === status)
      } 
      /* istanbul ignore next */
      else {
        // in prod environment
        const userEmail = JSON.parse(localStorage.getItem("user")).email
        selectCondition =
          (bill.status === status) &&
          ![...USERS_TEST, userEmail].includes(bill.email)
      }

      return selectCondition
    }) : []
}

// Génère une carte HTML pour une facture donnée
export const card = (bill) => {
  const firstAndLastNames = bill.email.split('@')[0]
  const firstName = firstAndLastNames.includes('.') ?
    firstAndLastNames.split('.')[0] : ''
  const lastName = firstAndLastNames.includes('.') ?
  firstAndLastNames.split('.')[1] : firstAndLastNames

  return (`
    <div class='bill-card' id='open-bill${bill.id}' data-testid='open-bill${bill.id}'>
      <div class='bill-card-name-container'>
        <div class='bill-card-name'> ${firstName} ${lastName} </div>
        <span class='bill-card-grey'> ... </span>
      </div>
      <div class='name-price-container'>
        <span> ${bill.name} </span>
        <span> ${bill.amount} € </span>
      </div>
      <div class='date-type-container'>
        <span> ${formatDate(bill.date)} </span>
        <span> ${bill.type} </span>
      </div>
    </div>
  `)
}

// Regroupe toutes les cartes HTML pour une liste de factures
export const cards = (bills) => {
  return bills && bills.length ? bills.map(bill => card(bill)).join("") : ""
}

// Traduit un index de statut du bill en string
export const getStatus = (index) => {
  switch (index) {
    case 1:
      return "pending"
    case 2:
      return "accepted"
    case 3:
      return "refused"
  }
}

export default class {
  constructor({ document, onNavigate, store, bills, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store

    // Lie les méthodes au bon contexte "this" afin que quand un bouton ou une action veut l'utiliser, il ne se perd pas !(.bind)
    this.handleEditTicket = this.handleEditTicket.bind(this)
    this.handleClickIconEye = this.handleClickIconEye.bind(this)
    this.handleAcceptSubmit = this.handleAcceptSubmit.bind(this)
    this.handleRefuseSubmit = this.handleRefuseSubmit.bind(this)
    this.handleShowTickets = this.handleShowTickets.bind(this)

    // Événements de clic pour les flèches des statuts
    $('#arrow-icon1').click((e) => this.handleShowTickets(e, bills, 1))
    $('#arrow-icon2').click((e) => this.handleShowTickets(e, bills, 2))
    $('#arrow-icon3').click((e) => this.handleShowTickets(e, bills, 3))

    new Logout({ localStorage, onNavigate })
  }

  // Affiche l'image du justificatif dans la modale
  handleClickIconEye = () => {
    const billUrl = $('#icon-eye-d').attr("data-bill-url")
    const imgWidth = Math.floor($('#modaleFileAdmin1').width() * 0.8)
    $('#modaleFileAdmin1').find(".modal-body").html(`<div style='text-align: center;'><img width=${imgWidth} src=${billUrl} alt="Bill"/></div>`)
    if (typeof $('#modaleFileAdmin1').modal === 'function') $('#modaleFileAdmin1').modal('show')
  }

  // Affiche ou replie une liste de factures selon leur statut
  handleShowTickets(e, bills, index) {
    console.log("→ handleShowTickets appelé ", index)

    const container = $(`#status-bills-container${index}`)
    const arrow = $(`#arrow-icon${index}`)
    const isOpen = container.html().trim() !== ""

    if (isOpen) {
      console.log("→ Liste déjà ouverte, on la replie")
      arrow.css({ transform: 'rotate(90deg)' })
      container.html("")
    } else {
      console.log("→ Liste fermée, on la déplie")
      arrow.css({ transform: 'rotate(0deg)', transition: 'transform 0.3s ease' })

      const filtered = filteredBills(bills, getStatus(index))
      console.log("→ Bills filtrés par son statut :", filtered)

      container.html(cards(filtered))

      // Ajoute les événements sur les tickets visibles
      filtered.forEach(bill => {
        const selector = `#open-bill${bill.id}`
        console.log(`→ Attachement listener sur ${selector}`)
        $(selector).click((e) => this.handleEditTicket(e, bill, bills))
      })
    }

    return bills
  }

  // Gère le clic sur un ticket pour afficher ou fermer le formulaire
  handleEditTicket(e, bill, bills) {
    console.log("→ handleEditTicket appelé")
    console.log("→ Ticket cliqué :", bill.id)
    console.log("→ Ticket actuellement affiché :", this.id)

    // Si l'utilisateur clique sur le même ticket (bill.id) déjà affiché, on le referme
    if (this.id === bill.id) {
      console.log("→ Même ticket recliqué : fermeture (toggle OFF)")
      // Restaure la couleur de fond par défaut sur la carte
      $(`#open-bill${bill.id}`).css({ background: '#0D5AE5' })
      // La note de frais à droite retrouve son état initial 
      $('.dashboard-right-container div').html(`
        <div id="big-billed-icon" data-testid="big-billed-icon"> ${BigBilledIcon} </div>
      `)
      $('.vertical-navbar').css({ height: '120vh' })
      //Et surtout je réinitialise l'état du bill sélectionné
      this.id = null
    } else {
      // Par contre si un new bill est sélectionné
      console.log("→ Nouveau ticket sélectionné : affichage du formulaire")
      bills.forEach(b => {
        $(`#open-bill${b.id}`).css({ background: '#0D5AE5' })
      })
      $(`#open-bill${bill.id}`).css({ background: '#2A2B35' })
      // Affiche le formulaire de la facture dans la partie droite 
      $('.dashboard-right-container div').html(DashboardFormUI(bill))
      $('.vertical-navbar').css({ height: '150vh' })

      // Attache les actions sur les boutons et l'œil du formulaire
      $('#icon-eye-d').click(this.handleClickIconEye)
      $('#btn-accept-bill').click((e) => this.handleAcceptSubmit(e, bill))
      $('#btn-refuse-bill').click((e) => this.handleRefuseSubmit(e, bill))
      // $ est un raccourci pour jQuery() afin de manipuler le DOM 

       // Mémorise le ticket sélectionné actuellement
      this.id = bill.id
    }
  }

  // Traitement d'acceptation d'une facture
  handleAcceptSubmit = (e, bill) => {
    const newBill = {
      ...bill,
      status: 'accepted',
      commentAdmin: $('#commentary2').val()
    }
    this.updateBill(newBill)
    this.onNavigate(ROUTES_PATH['Dashboard'])
  }

  // Traitement de refus d'une facture
  handleRefuseSubmit = (e, bill) => {
    const newBill = {
      ...bill,
      status: 'refused',
      commentAdmin: $('#commentary2').val()
    }
    this.updateBill(newBill)
    this.onNavigate(ROUTES_PATH['Dashboard'])
  }

  // Fonction qui me sert à récupéré toutes les factures de tous les utilisateurs (back-office)
  getBillsAllUsers = () => {
    if (this.store) {
      return this.store
      .bills()
      .list()
      .then(snapshot => {
        const bills = snapshot
        .map(doc => ({
          id: doc.id,
          ...doc,
          date: doc.date,
          status: doc.status
        }))
        return bills
      })
      .catch(error => {
        throw error;
      })
    }
  }

  // Met à jour une facture sur le serveur
  updateBill = (bill) => {
    if (this.store) {
      return this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: bill.id })
        .then(bill => bill)
        .catch(console.log)
    }
  }
}