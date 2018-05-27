const API_ORIGIN = "{{API_ORIGIN}}";
const SECRET_KEY = "{{SECRET_KEY}}";
fetch(`${API_ORIGIN}/clipboard`, {
    headers: {
        "secret-key": SECRET_KEY
    }
})
    .then(res => {
        if (!res.ok) {
            throw new Error(res.statusText);
        }
        return res.json();
    })
    .then(response => {
        if (response.text) {
            location.href = response.text.trim();
        }
    })
    .catch(error => {
        alert(error);
    });
