const API_ORIGIN = "{{API_ORIGIN}}";
const SECRET_KEY = "{{SECRET_KEY}}";
const selectedContent = String(window.getSelection());
fetch(`${API_ORIGIN}/clipboard`, {
    method: "post",
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "secret-key": SECRET_KEY
    },
    body: JSON.stringify({
        text: selectedContent
    })
}).catch(error => {
    alert(error);
});
