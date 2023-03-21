const emailElement = document.getElementById("email");
const passwordElement = document.getElementById("password");

const alertSuccess = document.getElementById("alert-success");
const alertBad = document.getElementById("alert-bad");

document.getElementById("registreer").addEventListener("click", async (e) => {
  e.preventDefault();

  const email = emailElement.value;
  const password = passwordElement.value;

  if (
    !email.length ||
    !password.length ||
    !emailElement.checkValidity() ||
    !passwordElement.checkValidity()
  ) {
    alertBad.innerText = "Geef zowel je email als wachtwoord in van Actief";
    alertBad.style.display = "block";
    alertSuccess.style.display = "none";
  }

  const res = await fetch("/api/register", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  }).then((res) => res.json());

  if (res.error && res.code === 1) {
    alertBad.innerText =
      "Het opgegeven email bestaat al! Contacteer Stijn indien dit een probleem is.";
    alertBad.style.display = "block";
    alertSuccess.style.display = "none";
  } else if (res.error && res.code === 2) {
    alertBad.innerText = "De opgegeven inloggegevens zijn ongeldig!";
    alertBad.style.display = "block";
    alertSuccess.style.display = "none";
  } else {
    alertSuccess.innerText = `Account successvol aangemaakt. Gebruik het volgende url om je kalender updates te ontvangen: https://${window.location.hostname}/calendar/${res.id}`;
    alertSuccess.style.display = "block";
    alertBad.style.display = "none";
  }
});
