/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";


// On dit que l'utilisateur est un employé connecté
Object.defineProperty(window, "localStorage", { value: localStorageMock });
window.localStorage.setItem(
  "user",
  JSON.stringify({ type: "Employee", email: "test@tonton.fr" })
);

// Étant donné que je suis connecté en tant qu'employé
describe("Given I am connected as an employee", () => {
  // Quand je suis sur la page NewBill
  describe("When I am on NewBill Page", () => {

    // Test unitaire : Upload d'un fichier image valide
    // Ce test vérifie qu'on peut uploader un fichier PNG, JPEG , JPG
    test("Then I should be able to upload a valid file", async () => {
      document.body.innerHTML = NewBillUI();

      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      const fileInput = screen.getByTestId("file");
      const file = new File(["img"], "test.png", { type: "image/png" });

      // Je charge un fichier dans le champ file
      userEvent.upload(fileInput, file);

      expect(fileInput.files[0].name).toBe("test.png");
    });

    // Test unitaire : Upload d'un fichier texte interdit
    // Ce test vérifie qu'une alerte s'affiche si le fichier est du mauvais format
    test("Then I should see an alert if I upload a wrong file type", async () => {
      document.body.innerHTML = NewBillUI();

      const alertMock = jest.spyOn(window, "alert").mockImplementation();
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      const fileInput = screen.getByTestId("file");
      const badFile = new File(["txt"], "test.txt", { type: "text/plain" });

      userEvent.upload(fileInput, badFile);

      expect(alertMock).toHaveBeenCalled(); // Une alerte s'affiche
      alertMock.mockRestore();
    });
  });

  // Test d'intégration : POST d'une note de frais
  // Ce test simule tout le processus de création et envoi d'une note
  test("Then it should send POST request with bill data (integration POST)", async () => {
    document.body.innerHTML = NewBillUI();

    const onNavigate = jest.fn();
    const mockCreate = jest.fn(() =>
      Promise.resolve({
        fileUrl: "https://localhost:3456/images/test.jpg",
        key: "12345",
      })
    );
    const mockUpdate = jest.fn(() => Promise.resolve());

    const storeMock = {
      bills: () => ({
        create: mockCreate,
        update: mockUpdate,
      }),
    };

    const newBill = new NewBill({
      document,
      onNavigate,
      store: storeMock,
      localStorage: window.localStorage,
    });

    // Je charge un bon fichier image
    const file = new File(["img"], "test.png", { type: "image/png" });
    const fileInput = screen.getByTestId("file");
    userEvent.upload(fileInput, file);

    await waitFor(() => expect(mockCreate).toHaveBeenCalled());

    // Je remplis tous les champs du formulaire
    screen.getByTestId("expense-type").value = "Transports";
    screen.getByTestId("expense-name").value = "Taxi Paris";
    screen.getByTestId("amount").value = "40";
    screen.getByTestId("datepicker").value = "2023-01-01";
    screen.getByTestId("vat").value = "10";
    screen.getByTestId("pct").value = "20";
    screen.getByTestId("commentary").value = "Déplacement pro";

    const form = screen.getByTestId("form-new-bill");
    fireEvent.submit(form); // Je clique sur "Envoyer"

    // On attend que le POST ait eu lieu
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled(); // On vérifie que le POST a bien été fait
    });
  });
});