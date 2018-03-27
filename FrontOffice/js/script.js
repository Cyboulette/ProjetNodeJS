Vue.prototype.$http = axios;
var app = new Vue({
  el : '#app-graphique',
  data : {
    selected : null,
    monnaies: null,
  },
  created: function() {
    var vm = this;
    this.$http.get('http://localhost:8080/api/monnaies').then(function(res) {
      vm.monnaies = res.data.data;
    });
  },
  methods: {
    updateGraph:function(){
      var vm = this;
      this.$http.get('http://localhost:8080/api/historique/'+ vm.selected).then(function(res) {
        var points = [];
        for(let key in res.data.data.historique) {
          var data = res.data.data.historique[key];
          var point = [];
          point.push(data.time);
          point.push(data.high);
          points.push(point);
        }

        Highcharts.stockChart('graphique', {
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
      });

    }
  }
});
