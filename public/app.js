$.getJSON("/hikes", function(data) {
    console.log(data);
});

//scrapes from API and loads new data into database
$("#Hikes").on('click', function(event) {
    event.preventDefault();
    $.ajax({
        method: 'POST',
        url: '/hikes'
    })
    .then(function(response) {
        console.log(response);
    })
    .catch(function(err) {
        console.log(err);
    })
})

