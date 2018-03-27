$(function() {
	$.ajax({
		type: 'GET',
		dataType: 'json',
		url: 'https://min-api.cryptocompare.com/data/all/coinlist'
	}).done(function(result){
		for(var key in result.Data) {
			var id = result.Data[key].Id;
			var option = '<option value="'+key+'">'+key+'</option>';
			$('#liste_monnaies').append(option);
		}
	}).fail(function(){

	});

	$('#charger').on('click', function(e) {
		e.preventDefault();

		var name = $('#liste_monnaies option:selected').val();

		$.ajax({
			type: 'GET',
			dataType: 'json',
			url: 'https://min-api.cryptocompare.com/data/histoday?fsym='+name+'&tsym=EUR&allData=true'
		}).done(function(result) {
			var points = [];
			for(var key in result.Data) {
				var data = result.Data[key];
				var point = [];
				point.push(data.time*1000);
				point.push(data.high);
				points.push(point);
			}

		    Highcharts.stockChart('container', {
		        rangeSelector: {
		            selected: 1
		        },
		        title: {
		            text: name+' Stock Price'
		        },
		        series: [{
		            name: name,
		            data: points,
		            tooltip: {
		                valueDecimals: 2
		            }
		        }]
		    });

		}).fail(function() {

		});
	})
});