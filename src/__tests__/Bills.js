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
  // Lorsque je suis sur la page Bills
  describe("When I am on Bills Page", () => {

    // Test Unitaire : l’icône bills doit être surlignée
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      // Crée un div #root pour insérer la page
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')

      // Vérifie que l'icône Bills a bien la classe CSS "active-icon"
      expect(windowIcon.classList.contains("active-icon")).toBe(true)
    })

    // Test Unitaire : les factures doivent être triées du plus récent au plus ancien
    test("Then bills should be ordered from latest to earliest", () => {
      document.body.innerHTML = BillsUI({ data: bills })

      // Récupère toutes les dates affichées au format ISO yyyy-mm-dd
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map(a => a.innerHTML)

      // Trie décroissant : plus récent en premier
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)

      // Vérifie que l'ordre affiché correspond à l'ordre décroissant attendu
      expect(dates).toEqual(datesSorted)
    })

    // Test Unitaire : devrait afficher un tbody vide si les données sont vides
    test("Should render empty tbody when data is empty", () => {
      document.body.innerHTML = BillsUI({ data: [] })
      const tbody = screen.getByTestId("tbody")

      // Vérifie qu'il n'y a pas de ligne dans le tbody
      expect(tbody.querySelectorAll("tr").length).toBe(0)
    })

    // Test Unitaire : devrait afficher une ligne "Aucune facture valide" si les dates sont invalides
    test("Should render empty tbody when data contains invalid dates", () => {
      // Création de factures avec dates invalides
      const billsWithInvalidDates = [
        { type: "Transports", name: "Test 1", date: "", amount: 100, status: "En attente", fileUrl: "#" },
        { type: "Hôtel", name: "Test 2", date: null, amount: 200, status: "Accepté", fileUrl: "#" },
        { type: "Repas", name: "Test 3", date: "32 Mars 2022", amount: 50, status: "Refusé", fileUrl: "#" },
        { type: "Equipement", name: "Test 4", date: "FooBar", amount: 75, status: "En attente", fileUrl: "#" },
      ]

      document.body.innerHTML = BillsUI({ data: billsWithInvalidDates })
      const tbody = screen.getByTestId("tbody")

      // Vérifie qu'une seule ligne affiche "Aucune facture valide"
      const rows = tbody.querySelectorAll("tr")
      expect(rows.length).toBe(1)
      expect(rows[0].textContent).toMatch(/Aucune facture valide/i)
    })
  })

  // Lorsque je clique sur le bouton "Nouvelle note de frais"
  describe("When I click on 'Nouvelle note de frais'", () => {
    // Test Unitaire : la navigation doit se faire vers la page NewBill
    test("Then it should navigate to NewBill page", () => {
      document.body.innerHTML = BillsUI({ data: bills })

      const onNavigate = jest.fn()
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage
      })

      const newBillButton = screen.getByTestId("btn-new-bill")
      const handleClickNewBill = jest.fn(billsContainer.handleClickNewBill)
      newBillButton.addEventListener("click", handleClickNewBill)
      fireEvent.click(newBillButton)

      expect(handleClickNewBill).toHaveBeenCalled()
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill'])
    })
  })

  // Lorsque je navigue vers la page Bills
  describe("When I navigate to Bills", () => {
    // Test Unitaire : les factures sont bien récupérées depuis l'API mockée
    test("Then it should fetch bills from mock API", async () => {
      const appelFactures = jest.spyOn(mockStore, "bills")
      const bills = await mockStore.bills().list()

      expect(appelFactures).toHaveBeenCalled()
      expect(bills.length).toBeGreaterThan(0)
    })
  })

  // Lorsque je clique sur l’icône œil d’une facture
  describe("When I click on the eye icon of a bill", () => {
    // Test Unitaire : la modale doit s’ouvrir avec le justificatif
    test("Then a modal should open with the bill proof", () => {
      document.body.innerHTML = BillsUI({ data: bills, loading: false, error: null })

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage
      })

      // Mock Bootstrap modal
      $.fn.modal = jest.fn()

      const iconEye = screen.getAllByTestId("icon-eye")[0]
      const handleClickIconEye = jest.fn(() => billsContainer.handleClickIconEye(iconEye))
      iconEye.addEventListener("click", handleClickIconEye)
      fireEvent.click(iconEye)

      expect(handleClickIconEye).toHaveBeenCalled()
      expect(screen.getByTestId("modaleFile")).toBeTruthy()
    })
  })

  // Lorsque j’appelle la méthode getBills()
  describe("When I call getBills()", () => {
    // Test Unitaire : la méthode doit retourner les factures formatées
    test("Then it should return formatted bills", async () => {
      const billsContainer = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage
      })

      const billsList = await billsContainer.getBills()
      expect(billsList).toBeTruthy()
      expect(billsList.length).toBeGreaterThan(0)

      billsList.forEach(bill => {
        expect(typeof bill.date === 'string' && bill.date.trim().length > 0).toBe(true)
        const validStatuses = ["En attente", "Accepté", "Refusé"]
        expect(validStatuses).toContain(bill.status)
      })
    })

    // Test Unitaire : la méthode doit gérer correctement des données corrompues
    test("Then it should handle corrupted data gracefully", async () => {
      const corruptedStore = {
        bills: () => ({
          list: () => Promise.resolve([
            { id: 1, date: "invalid-date", status: "pending" }
          ])
        })
      }

      const billsContainer = new Bills({
        document,
        onNavigate: jest.fn(),
        store: corruptedStore,
        localStorage: window.localStorage
      })

      const billsList = await billsContainer.getBills()
      // Vérifie que la date brute retournée est bien "invalid-date" telle quelle, même si ce n'est pas un format valide, pour s'assurer que la donnée n'est pas modifiée
      expect(billsList[0].date).toBe("invalid-date")
      // Vérifie que le statut erroné "pending" est corrigé par la méthode getBills() et devient "En attente", valeur attendue dans l'application
      expect(billsList[0].status).toBe("En attente")
    })
  })
})
