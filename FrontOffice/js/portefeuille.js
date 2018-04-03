Vue.prototype.$http = axios;

var portefeuille = new Vue({
  el : '#portefeuille',
  data : {
    monnaies: null,
    selected: null,
    nbCrypto: null
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
        this.$http.get('http://localhost:8080/api/portefeuille/'+ vm.selected).then(function(res) {
          if(res.data.historique.length >0){

            var points = [];
            for(let key in res.data.historique) {
              var data = res.data.historique[key];
              var point = [];
              point.push(data.time);
              point.push(data.total);
              points.push(point);
            }
            Highcharts.stockChart('graphique', {
              rangeSelector: {
                selected: 1
              },
              title: {
                text: vm.selected +' Portefeuille'
              },
              series: [{
                name: vm.selected,
                data: points,
                tooltip: {
                  valueDecimals: 2
                }
              }]
            });
            // vm.titre = "Bourse"
            // vm.tableau = "<td>"+ vm.selected +"</td><td>"+points[points.length-1][1]+"€</td>";
          }else{
            $('#graphique').html('<div class="alert alert-info">Portefeuille Vide</div>');
            this.tableau = null;
            this.titre = null;
          }
        });
      }else{
        $('#graphique').html("");
        this.tableau = null;
        this.titre = null;
      }
    },
    buy:function(){
      var vm = this;
      if(vm.selected != "null") {
        this.$http.post('http://localhost:8080/api/portefeuille/'+ vm.selected, {amount: this.$refs.input_buy.value}).then(function(res) {
          if(res.data.success == true){
            $('#alert-buy').html('<div class="alert alert-success">Achat effectué !</div><div class="badge badge-primary">Solde en Euros :'+ res.data.soldeRestantEuros+'€</div><div class="badge badge-primary">Solde '+ vm.selected+':'+ res.data.soldeRestantEuros+'</div>');
          }else{
            $('#alert-buy').html('<div class="alert alert-danger"> '+ res.data.message +' </div>');
          }
        });
      }
    }
  }
});
