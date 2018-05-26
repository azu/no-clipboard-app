const activeElement = document.activeElement;
fetch("https://localhost:7678/clipboard")
    .then(res => {
        return res.json();
    })
    .then(response => {
        if (response.text) {
            activeElement.value = response.text;
        }
    });
