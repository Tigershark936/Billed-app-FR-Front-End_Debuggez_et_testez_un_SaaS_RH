import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    console.log('store', store);
    console.log('localstorage', localStorage);
    console.log(document);
    console.log(onNavigate);
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    const file = this.document.querySelector(`input[data-testid="file"]`)
    file.addEventListener("change", this.handleChangeFile)
    console.log('file', file);
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    new Logout({ document, localStorage, onNavigate })
  }
  handleChangeFile = e => {
    e.preventDefault()
    console.log("handleChangeFile déclenchée")
    const file = this.document.querySelector(`input[data-testid="file"]`).files[0]
    console.log('e', e);
    console.log('file', file);

    // Vérification que le fichier existe
    if (!file) return;

    const fileName = file.name;
    console.log('filename', fileName);
    const extension = fileName.split('.').pop();

    if(!['jpg', 'jpeg', 'png'].includes(extension.toLowerCase())){
      alert ("Seulement les fichiers '.jpg', '.jpeg' ou '.png' sont autorisés dans les notes de frais.");
      e.target.value = "";
      return;
    }
    
    const filePath = e.target.value.split(/\\/g);
    console.log('filepath', filePath);
    const formData = new FormData()
    console.log('formdata', formData);
    const email = JSON.parse(localStorage.getItem("user")).email
    
    formData.append('file', file)
    formData.append('email', email)

    this.store
      .bills()
      .create({
        data: formData,
        headers: {
          noContentType: true
        }
      })
      .then(({fileUrl, key}) => {
        console.log(fileUrl)
        this.billId = key
        this.fileUrl = fileUrl
        this.fileName = fileName
      }).catch(error => console.error(error))
  }
  handleSubmit = e => {
    e.preventDefault()

    let isFormValid = true;

    if (!this.fileUrl || !this.fileName) {
      alert("Vous devez ajouter un fichier justificatif au bon format (.jpg, .jpeg ou .png).");
      isFormValid = false;
    }

    if (!isFormValid) {
      return; // On ne va pas plus loin
    }
    console.log('e.target.querySelector(`input[data-testid="datepicker"]`).value', e.target.querySelector(`input[data-testid="datepicker"]`).value)
    const email = JSON.parse(localStorage.getItem("user")).email
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name:  e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
      date:  e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: 'pending'
    }
    this.updateBill(bill)
    this.onNavigate(ROUTES_PATH['Bills'])
  }

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
      .bills()
      .update({data: JSON.stringify(bill), selector: this.billId})
      .then(() => {
        this.onNavigate(ROUTES_PATH['Bills'])
      })
      .catch(error => console.error(error))
    }
  }
}