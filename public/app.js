//displays all hikes from database
$.getJSON("/hikes", function (data) {
    console.log(data);
});

//scrapes from API and loads new data into database
$("#Hikes").on('click', function (event) {
    event.preventDefault();
    $.ajax({
        method: 'POST',
        url: '/hikes'
    })
        .then(function (response) {
            console.log(response);
        })
        .catch(function (err) {
            console.log(err);
        })
})

//display one hike from database based on user selection
$("#hike").on('click', function (event) {
    event.preventDefault();
    let id = $(this).data('id');
    console.log("frontend HIKE ID IS: ", id);
    $.ajax({
        method: 'GET',
        url: `/hike/${id}`
    })
        .then(function (response) {
            console.log(response);
        })
        .catch(function (err) {
            console.log(err);
        })
})

//add a new user to database
$("#addUser").on('click', function (event) {
    event.preventDefault();
    let username = $(this).data('username');
    let password = $(this).data('password');
    let email = $(this).data('email');
    $.ajax({
        method: 'POST',
        url: `/user/${username}/${password}/${email}`
    })
})

//get info about one user
$("#getOneUser").on('click', function (event) {
    event.preventDefault();
    let username = $(this).data('username');
    $.ajax({
        method: 'GET',
        url: `/user/${username}`
    })
        .then(function (response) {
            console.log(response);
        })
        .catch(function (err) {
            console.log(err);
        })
})