Vue.prototype.$http = axios;
var app = new Vue({
  el : '#app',
  data : {
    selected : null,
    monnaies: null,
    titre : null,
    tableau : null
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
        if(vm.selected != "null"){

        this.$http.get('http://localhost:8080/api/historique/'+ vm.selected).then(function(res) {
          var points = [];
          for(let key in res.data.data.historique) {
            var data = res.data.data.historique[key];
            var point = [];
            point.push(data.time);
            point.push(data.price);
            points.push(point);
          }
          Highcharts.stockChart('graphique', {
              rangeSelector: {
                  selected: 1
              },
              title: {
                  text: vm.selected +' Stock Price'
              },
              series: [{
                  name: vm.selected,
                  data: points,
                  tooltip: {
                      valueDecimals: 2
                  }
              }]
          });
          vm.titre = "Bourse"
          vm.tableau = "<td>"+ vm.selected +"</td><td>"+points[points.length-1][1]+"€</td>";
        });
      }else{
        $('#graphique').html("");
        this.tableau = null;
        this.titre = null;
      }
    }
  }
});

// var app = new Vue({
//   el : '#bourse',
//   data :
// });
