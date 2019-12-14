$("#hikes").click(function () {
    console.log("deadoralive")
    $.post("http://localhost:8080/login",
        {
            email: "test",
            password: "test",
        }
    )
})