export const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  // console.log(date);
  
    // Ajout : vérifie que la date est valide
  if (isNaN(date.getTime())) {
    return dateStr // ou éventuellement 'Date invalide' si tu préfères
  }

  const ye = new Intl.DateTimeFormat('fr', { year: 'numeric' }).format(date)
  const mo = new Intl.DateTimeFormat('fr', { month: 'short' }).format(date)
  const da = new Intl.DateTimeFormat('fr', { day: '2-digit' }).format(date)
  const month = mo.charAt(0).toUpperCase() + mo.slice(1)
  
  // console.log('return', `${parseInt(da)} ${month.substr(0,3)}. ${ye.toString().substr(2,4)}`);
  return `${parseInt(da)} ${month.substr(0,3)}. ${ye.toString().substr(2,4)}`
}
 
export const formatStatus = (status) => {
  switch (status) {
    case "pending":
      return "En attente"
    case "accepted":
      return "Accepté"
    case "refused":
      return "Refusé"
    default:
      return status // garde le brut si inconnu
  }
}