$("#login").click(function () {
    console.log("deadoralive")
    $.post("http://localhost:8080/login",
        {
            email: "test",
            password: "test",
        }
    )
})

$("#signup").click(function () {
    console.log("deadoralive")
    $.post("http://localhost:8080/sigunup",
        {   username:"test",
            email: "test",
            password: "test",
            confirm:"test"
        }
    )
})
