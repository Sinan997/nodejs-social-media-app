const deleteProduct = (btn) => {
    const csrf = btn.parentNode.querySelector("[name=_csrf]").value;
    const userId = btn.parentNode.querySelector("[name=userId]").value;
    const postId = btn.parentNode.querySelector("[name=postId]").value;
    console.log(userId);

    const postElement = btn.closest("article");

    fetch("http://localhost:3131/post/" + postId, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "csrf-token": csrf,
        },
        body: JSON.stringify({
            userId: userId
        })
    }).then(data => {
        console.log(data);
        postElement.parentNode.removeChild(postElement);
    }).catch(
        err => console.log(err)
    )
}

const changeLike = (btn) => {
    const csrf = btn.parentNode.querySelector("[name=_csrf]").value;
    const userId = btn.parentNode.querySelector("[name=userId]").value;
    const postId = btn.parentNode.querySelector("[name=postId]").value;



    const isActive = btn.querySelector("i").classList.contains("active");
    const iElement = btn.querySelector("i")
    let value = btn.querySelector("i").textContent.trim();
    if (isActive) {
        value--;
        iElement.classList.remove("active");
        iElement.textContent = " " + value

        fetch("http://localhost:3131/change-like/" + postId, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "csrf-token": csrf,
            },
            body: JSON.stringify({
                userId: userId
            })
        })



    } else {
        value++;
        iElement.classList.add("active");
        iElement.textContent = " " + value

        fetch("http://localhost:3131/change-like/" + postId, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "csrf-token": csrf,
            },
            body: JSON.stringify({
                userId: userId
            })
        })
    }
}




const searchBar = document.getElementById("searchProfile")
const suggBox = document.querySelector(".autocom-box");
const searchWrapper = document.querySelector(".search-input");

searchBar.addEventListener("keyup", () => {
    let userData = searchBar.value
    let emptyArray = [];
    if (userData) {
        fetch("http://localhost:3131/getUsers").then(users => users.json())
            .then(data => data.users)
            .then(usersArray => {
                let filteredList = [];
                usersArray.forEach(element => {
                    if (element.nickname.toLocaleLowerCase().startsWith(userData.toLocaleLowerCase())) {
                        filteredList.push(element);
                    }
                });
                emptyArray = filteredList.map((data) => {
                    return data = "<li>" + `<a href=/profile/${data.id}>` + data.nickname + "</a></li>";
                })
                console.log(emptyArray);
                searchWrapper.classList.add("active");
                showSuggestions(emptyArray);
            });
    } else {
        searchWrapper.classList.remove("active");
        showSuggestions(emptyArray);
    }
})

function showSuggestions(list) {
    let listData;
    console.log("show", list);
    if (!list.length) {
        userValue = searchBar.value;
        listData = "<li>" + userValue + "</li>";
    } else {
        listData = list.join("");
    }
    suggBox.innerHTML = listData;
}
