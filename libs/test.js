$.ajax({
    type: "POST",
    url: "/home/personnel/member/delete",
    data: {
        data: [
            {id : 1}
        ]
    },
    success: function(result){
        console.log(result);
    }
});

$.ajax({
    type: "POST",
    url: "/home/personnel/member/update",
    data: {
        data: [
            {
                id: 8,
                bankAccount: "",
                bankName: "",
                bankSymbol: "",
                cash: "0",
                comment: "",
                credit: "0",
                facebookId: "",
                frozenBalance: "0",
                lineId: "",
                name: "會員7",
                phoneNumber: "",
                rb: "0",
                wechatId: "",
            }
        ]
    },
    success: function(result){
        console.log(result);
    }
});

$.ajax({
    type: "POST",
    url: "/home/personnel/member/create",
    data: 'agentAccount=agent2&name=1213&account=2131231&password=123&passwordConfirm=123&email=&cash=0&credit=0&rb=0&bankSymbol=&bankName=&bankAccount=&phoneNumber=&facebookId=&lineId=&wechatId=&comment=',
    success: function(result){
        console.log(result);
    }
});