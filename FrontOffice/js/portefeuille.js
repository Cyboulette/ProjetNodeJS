Vue.prototype.$http = axios;

var portefeuille = new Vue({
  el : '#portefeuille',
  data : {
    monnaies: null,
    selected: null,
    nbCrypto: null,
    tableau: []
  },
  created: function() {
    var vm = this;
    this.$http.get('http://localhost:8080/api/monnaies').then(function(res) {
      vm.monnaies = res.data.data;
    });
    this.updatePortefeuille();
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
          }else{
            $('#graphique').html('<div class="alert alert-info">Portefeuille Vide</div>');
          }
        });
      }else{
        $('#graphique').html("");
      }
    },
    buy:function(){
      var vm = this;
      if(vm.selected != "null") {
        if(this.$refs.input_buy.value.length != 0){
          this.$http.post('http://localhost:8080/api/portefeuille/'+ vm.selected, {amount: this.$refs.input_buy.value}).then(function(res) {
            if(res.data.success == true){
              $('#alert-buy').html('<div class="alert alert-success">Achat effectué !</div>');
            }else{
              $('#alert-buy').html('<div class="alert alert-danger"> '+ res.data.message +' </div>');
            }
            vm.updatePortefeuille();
          });
        }else {
          $('#alert-buy').html('<div class="alert alert-danger">Saisissez un montant </div>');
        }
      }else{
        $('#alert-buy').html('<div class="alert alert-danger">Séléctionnez une monnaie </div>');
      }
    },
    sell:function(){
      var vm = this;
      if(vm.selected != "null") {
        if(this.$refs.input_sell.value.length != 0){
          this.$http.post('http://localhost:8080/api/portefeuille/'+ vm.selected+'/vendre', {amount: this.$refs.input_sell.value}).then(function(res) {
            if(res.data.success == true){
              $('#alert-sell').html('<div class="alert alert-success">Vente effectuée !</div>');
            }else{
              $('#alert-sell').html('<div class="alert alert-danger"> '+ res.data.message +' </div>');
            }
            vm.updatePortefeuille();
          });
        }else {
          $('#alert-sell').html('<div class="alert alert-danger">Saisissez un montant </div>');
        }
      }else{
        $('#alert-sell').html('<div class="alert alert-danger">Séléctionnez une monnaie </div>');
      }
    },
    updatePortefeuille:function(){
      this.tableau.length = 0;
      var vm = this;
      this.$http.get('http://localhost:8080/api/portefeuille/').then(function(res) {
        console.log(res.data.data);
        for(var mon in res.data.data){
          var data = res.data.data[mon];
          vm.tableau.push("<td>"+ data.name +"</td><td>"+data.solde+"</td>");
        }
      });

    }
  }
});
