/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import router from "../app/Router.js"
import Bills from "../containers/Bills.js"
import mockStore from "../__mocks__/store.js"

// Étant donné que je suis connecté en tant qu'employé
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {

    // Test Unitaire : l’icône bills doit être surlignée
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression

      // Ajout de cette ligne pour finaliser le test afin de vérifié que l'icone est true si .active-icon
      expect(windowIcon.classList.contains("active-icon")).toBe(true)
    })

    // Test Unitaire : les factures doivent être triées du + récent au + ancien
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
  
  // Étant donné que je suis connecté en tant qu'employé et que je clique sur le bouton "Nouvelle note de frais"
  describe("When I click on 'Nouvelle note de frais'", () => {
    // Test Unitaire : sur ce qui se passe quand on clique sur le bouton "Nouvelle note de frais"
    test("Then it should navigate to NewBill page", () => {
      // Afficher l'interface Bills
      document.body.innerHTML = BillsUI({ data: bills })

      // Simuler la navigation
      const onNavigate = jest.fn()
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage
      })

      // On prend et simule le bouton qui dit "Nouvelle note de frais" avec un controle du click et si click on utilise la fonction + un event par the user 
      const newBillButton = screen.getByTestId("btn-new-bill")
      const handleClickNewBill = jest.fn(billsContainer.handleClickNewBill)
      newBillButton.addEventListener("click", handleClickNewBill)
      fireEvent.click(newBillButton)
      
      // Vérifie que la fonction a été appelée et que la navigation est sur la bonne page
      expect(handleClickNewBill).toHaveBeenCalled()
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill'])
    })
  })
  
  // Étant donné que je suis connecté en tant qu'employé et que je navigue vers la page Bills
  describe("When I navigate to Bills", () => {
    // Test Unitaire : si la page récupère bien les factures
    test("Then it should fetch bills from mock API", async () => {
      // On va observe la fonction pour l'appel à mockStore.bills()
      const appelFactures = jest.spyOn(mockStore, "bills")
      
      // on utilise la fonction pour aller chercher les données avec la méthode .list() du store mocké
      const bills = await mockStore.bills().list()
      
      // Vérifie que la méthode a bien été appelée et que des données ont été récupérées
      expect(appelFactures).toHaveBeenCalled()
      expect(bills.length).toBeGreaterThan(0)
    })
  })
  
  // Étant donné que je suis connecté en tant qu'employé et que je clique sur l'icône œil d'une facture
  describe("When I click on the eye icon of a bill", () => {
    // Test Unitaire : Clic sur une icône œil donc modale s’ouvre
    test("Then a modal should open with the bill proof", () => {
      // Injecte le HTML avec les données mockées
      document.body.innerHTML = BillsUI({ data: bills, loading: false, error: null })

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      };

      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage
      });

      // On évite une erreur Bootstrap en simulant $.fn.modal()
      $.fn.modal = jest.fn()

      // On récupère la première icône "œil"
      const iconEye = screen.getAllByTestId("icon-eye")[0]

      // On simule le clic
      const handleClickIconEye = jest.fn(() => billsContainer.handleClickIconEye(iconEye))
      iconEye.addEventListener("click", handleClickIconEye)
      fireEvent.click(iconEye)

      // On vérifie que la fonction handleClickIconEye a été appelée
      expect(handleClickIconEye).toHaveBeenCalled()

      // On vérifie que la modale est bien présente dans le DOM
      const modal = screen.getByTestId("modaleFile")
      expect(modal).toBeTruthy()
    })
  })

  // Étant donné que je suis connecté en tant qu'employé et que je veux récupérer mes factures
  describe("When I call getBills()", () => {
    // Test Unitaire : la fonction retourne bien les factures formatées
    test("Then it should return formatted bills", async () => {
      // On initialise le container Bills avec le store mocké
      const billsContainer = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage
      })

      // On récupère la liste des factures
      const billsList = await billsContainer.getBills()

      // On vérifie que la liste existe et n'est pas vide
      expect(billsList).toBeTruthy()
      expect(billsList.length).toBeGreaterThan(0)

      // On vérifie que pour chaque facture que la date est bien formatée et que le statut est traduit correctement
      billsList.forEach(bill => {
        // Vérifie que la date est formatée ou restituée correctement
        expect(bill.date).toMatch(/\d{1,2} [A-Za-zéû]+\. \d{2}/)
        // Vérifie que le statut brut attendu est bien présent
        const validStatuses = ["En attente", "Accepté", "Refusé"]
        expect(validStatuses).toContain(bill.status)
      })
    })

    // Test Unitaire : la fonction gère correctement des données corrompues
    test("Then it should handle corrupted data gracefully", async () => {
      const corruptedStore = {
        bills: () => ({
          list: () => Promise.resolve([
            { id: 1, date: "invalid-date", status: "pending" }
          ])
        })
      }

      // On initialise Bills avec le store corrompu
      const billsContainer = new Bills({
        document,
        onNavigate: jest.fn(),
        store: corruptedStore,
        localStorage: window.localStorage
      })

      // On récupère la liste des factures
      const billsList = await billsContainer.getBills()

      // On vérifie que la date brute est restituée si invalide
      expect(billsList[0].date).toBe("invalid-date")
      // On vérifie que le statut reste correctement traduit même si la date est invalide
      expect(billsList[0].status).toBe("En attente")
    })
  })
})
