
var oTable;
	var dataset = [
		//["shawn", 123456, 56789, 5000, 6000, null, null],
		//["tim", 56789, 45646, 2000, 50000, null, null]
	];

var Verify = function(){

	
	var initTable = function(){
		var table = $('#m_table_1');
		oTable = table.DataTable({

			responsive: true,
			searchDeley: 500,
			//data: dataset,
			"ajax": function(data, callback, settings){
				callback({data: dataset});
			},
			dom: `
			<'row'<'col-sm-6 text-left'><'col-sm-6 text-right'f>>
			<'row'<'col-sm-12'tr>>
			<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 dataTables_pager'lp>>`,
			columns:[
				{ title: "UUID"},
				{ title: "俱樂部ID"},
				{ title: "玩家"},
				{ title: "德鋪圈ID"},
				{ title: "房間"},
				{ title: "房間ID"},
				{ title: "買入"},
				{ title: "可用資產"},
				{ 
					
				 	"defaultContent": "<button id=\"acceptBuyin\" type=\"button\" class=\"btn m-btn--pill    btn-outline-success m-btn m-btn--outline-2x \">同意</button>"
				},
				{ 
					
					"defaultContent": "<button id=\"denyBuyin\" type=\"button\" class=\"btn m-btn--pill    btn-outline-success m-btn m-btn--outline-2x \">拒絕</button>"
				}
			],

			columnDefs:[
				{
					targets: 0,
					visible: false,
					orderable: false,
				},
				{
					targets: 5,
					visible: false,
					orderable: false,
				}
			]
		});

		table.on('click', '#acceptBuyin', function(e){
			var nRow = $(this).parents('tr')[0];
			let row = oTable.row(nRow).data();
			console.log("success");
			let data = { 				 
						 userUuid: row[0],
						 roomId: row[5]
						};
			//console.log({row});
			$.ajax({
				url : '/home/game/verify/acceptBuyin',
				method : 'POST',
				data : {
					clubId: row[1],
					data: data
				},
				success: function(response){

				}

			});
		});

		table.on('click', '#denyBuyin', function(e){
			var nRow = $(this).parents('tr')[0];
			var nAcceptButton = $(this).parents('tr').find('td')[6];

			$(this).addClass('m-loader m-loader--success m-loader--right')
			.attr('disabled', true);
			$(nAcceptButton).find('button').attr('disabled', true);
			let row = oTable.row(nRow).data();
			let data = { 				 
						 userUuid: row[0],
						 roomId: row[5]
						};
			
			$.ajax({
				url : '/home/game/verify/denyBuyin',
				method : 'POST',
				data : {
					clubId: row[1],
					data: data
				},
				success: function(response){
					console.log({response});
					if(response.err == false && response.msg === 'success'){
						msg = row[2] + '拒絕買入成功';
						notify(msg);
						oTable.row(nRow).remove().draw();
						
					}else{
						msg = row[2] + '拒絕買入失敗';
						notify(msg);
						$(this).removeClass('m-loader m-loader--success m-loader--right')
						.attr('disabled', false);
						$(nAcceptButton).find('button').attr('disabled', false);
					}
				}

			});
		})
	};

	var initSocketio = function(){
		var socket = io.connect('http://localhost:8000/cms');
			socket.on('connect', function(){
				socket.emit('authentication');
				socket.on('success', function(data){
					socket.on('client:' + data, function( data){
						let id = 0;
						dataset = [];
						//console.log({data});
						for(let i = 0; i < data.length; i++){
							let clubId = data[i].clubId;
							let result = data[i].data.result;
							//console.log({result});
							for(let j = 0; j < result.length; j++){
								({uuid, strNick, showId, gameRoomName, gameRoomId, buyStack, availBalance} = result[j]);
								dataset[id++] = [uuid, clubId, strNick, showId, gameRoomName, gameRoomId, buyStack, availBalance, null, null];
							}				
						}
						console.log({dataset});
						oTable.ajax.reload();
					});
				});
				socket.on('unauthorized', function(data){
					console.log(data);
				});
			});
	}

	var notify = function(msg){
		$.notify({
				icon: 'glyphicon glyphicon-warning-sign',
				//title: 'Bootstrap notify',
				message: msg,
				target: '_blank'
			},{
				element: 'body',
				position: null,
				type: "info",
				allow_dismiss: true,
				newest_on_top: false,
				showProgressbar: false,
				placement: {
					from: "top",
					align: "right"
				},
				offset: 20,
				spacing: 10,
				z_index: 1031,
				delay: 3000,
				timer: 1000,
				url_target: '_blank',
				mouse_over: null,
				animate: {
					enter: 'animated fadeInDown',
					exit: 'animated fadeOutUp'
				},
				onShow: null,
				onShown: null,
				onClose: null,
				onClosed: null,
				icon_type: 'class',
			}

		);
	};

	return {
		init: function(){
			initTable();
			initSocketio();
		},

	};
}();

jQuery(document).ready(function(){

	Verify.init();
});