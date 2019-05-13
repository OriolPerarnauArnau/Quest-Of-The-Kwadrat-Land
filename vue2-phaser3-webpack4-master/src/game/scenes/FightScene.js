import { Scene } from 'phaser';
import { Carta } from './Card.js';
import { Deck } from './Deck.js';
import { Globals } from './Globals.js';
import { Hud } from './Hud.js'

var graphics;
var rect;

export default class FightScene extends Scene {
  constructor () {
    super({ key: 'FightScene' });
  }

  create () {
    //Zones
    graphics = this.add.graphics({ lineStyle: { width: 2, color: 0x0000aa }, fillStyle: { color: 0xaa0000 }});
    rect = new Phaser.Geom.Rectangle(200, 500, 400, 100);

    //Tauler

    this.deck = new Deck(this);
    this.tauler = new Tauler(this, 200, 200);
    this.children.add(this.tauler);
    this.ma = new Ma(this, 400, 500);
    this.children.add(this.ma);
    this.botoRobar = new BotoRobar(this, 750, 550, this.ma);
    this.children.add(this.botoRobar);
    this.botoFinal = new BotoFinalTurn(this, 750, 300);
    this.children.add(this.botoFinal);
    this.enemic = new Enemy(this, 600, 200)
    this.children.add(this.enemic);

    this.hud = new Hud(this, 20, 500);
    this.children.add(this.hud);

    //Inicialitzar turn
    this.ma.nouTurn();
    //this.text = this.add.text(300, 300, '').setFontFamily('Arial').setFontSize(15).setColor('#ffffff');
    //this.count = 0;
  }

  update () {
    //this.count++;
    //this.text.setText("Counter: " + this.count);
    graphics.clear();
    graphics.strokeRectShape(rect);
  }
}

class Enemy extends Phaser.GameObjects.Sprite{
  constructor (scene, x, y) {
    super(scene, x, y, 'enemic');
    this.scene = scene;
    this.vida = 20;
    this.escut = 0;
    this.veri = 0;
    this.rang_accio = [[1, 5], [1, 5]] // 0 = Attack 1 = Shield

    this.accioActual = [];

    this.textVida = scene.add.text(x-20, y+50, '').setFontFamily('Arial').setFontSize(15).setColor('#ffff00');
    this.textEscut = scene.add.text(x-20, y+75, '').setFontFamily('Arial').setFontSize(15).setColor('#ffff00');
    this.textIntencio = scene.add.text(x-50, y-50, '').setFontFamily('Arial').setFontSize(15).setColor('#ffff00');
    this.textVida.setDepth(1);
    this.textEscut.setDepth(1);
    this.textIntencio.setDepth(1);

    let that = this;

    this.crearAccio = function(){
      that.accioActual[0] = Math.floor(Math.random() * (that.rang_accio[0][1] - that.rang_accio[0][0])) + that.rang_accio[0][0];
      that.accioActual[1] = Math.floor(Math.random() * (that.rang_accio[1][1] - that.rang_accio[1][0])) + that.rang_accio[1][0];

    }

    this.updateCounters = function(){
      that.textVida.setText('Vida: ' + that.vida + ' (-' + that.veri + ')');
      that.textEscut.setText('Escut: ' + that.escut);
      that.textIntencio.setText(that.accioActual[0] + '/' + that.accioActual[1]);
      that.scene.update();
    }

    this.golpejat = function(valor){
      that.escut -= valor;
      if (that.escut < 0){
        that.vida += that.escut;
        that.escut = 0;
      }

      that.updateCounters();
    }

    this.enverinar = function(valor){
      that.veri += Math.floor(valor/2);
      that.updateCounters();
    }

    this.executarAccio = function(){
      that.escut = 0;
      that.escut += that.accioActual[1];
      Globals.escut -= that.accioActual[0];
      if (Globals.escut < 0){
        Globals.vida += Globals.escut;
        Globals.escut = 0;
      }

      that.updateCounters();
      that.scene.hud.updateCounter();
    }

    this.efecteVeri = function(){
      that.vida -= that.veri;
      that.veri--;
    }

    this.nouTurn = function(){
      that.crearAccio();
      if (that.veri > 0){
        that.efecteVeri();
      }
      that.updateCounters();
    }

    this.nouTurn();
  }

  update (){
    this.updateCounters();
  }

}

class Ma extends Phaser.GameObjects.Sprite{
  constructor (scene, x, y) {
    super(scene, x, y, 'bomb');
    this.scene = scene;
    this.accions = 4;

    this.cartes = [];

    this.cartes.forEach(function(element){
      scene.children.add(element);
    })

    let that = this;
    this.ordenarCartes = function(){
      let aux = 0;
      let mida = that.cartes.length;
      that.cartes.forEach(function(element, index){
        element.desplacarA([that.x + (index + 0.5 - mida/2) * 75, that.y]);
      })
    };

    this.robarCarta = function(){
      that.cartes.push(that.scene.deck.robarCarta());
      that.scene.children.add(that.cartes[that.cartes.length-1]);
      that.ordenarCartes();
    }

    this.nouTurn = function(){
      that.accions = 4;
      Globals.escut = 0;
      that.scene.hud.updateCounter();
      while(that.cartes.length < 4){
        that.robarCarta();
      }

    }
  }
}

class Tauler extends Phaser.GameObjects.Sprite{
  constructor (scene, x, y, ){
    super(scene, x, y, 'tauler');
    this.mida = 6;

    this.fitxesTauler = [];
    this.matriu = [[0,0,0,0,0,0],
                   [0,0,0,0,0,0],
                   [0,0,0,0,0,0],
                   [0,0,0,0,0,0],
                   [0,0,0,0,0,0],
                   [0,0,0,0,0,0]];
    //Buida = 0, Foc = 1, Gel = 2, Veri = 3 i Extra = 4

    this.valors = [0,0,0,0,0];
    this.cartesUsades = [];

    this.scene = scene;

    let that = this;

    //Funcio per colocar carta, retorna cert si l'ha pogut colocar4
    this.wait = function(ms){
      let start = new Date().getTime();
      while(true){
        if ((new Date().getTime() - start) > ms){
          break;
        }
      }
    }

    this.colocarCarta = function(carta){
      if (this.scene.ma.accions <= 0){
        return false;
      }

      //PREGUNTAR VECTOR
      let mousePos = [that.scene.input.mousePointer.x, that.scene.input.mousePointer.y];

      if ( ! (mousePos[0] >= that.x - 150 && mousePos[0] <= that.x + 150 && mousePos[1] >= that.y - 150 && mousePos[1] <= that.y + 150)){
        return false;
      }

      let nou_mouse = [mousePos[0] - (that.x - 150), mousePos[1] - (that.y - 150)]
      let casellaSeleccionada = [Math.trunc(nou_mouse[0]/50), Math.trunc(nou_mouse[1]/50)];

      //Comprobar que cap
      for (let i = -2; i < 2; i++){
        for (let j = -2; j < 2; j++){
          //Existeix la peca
          if (carta.val[j+2][i+2] != 0){

            //La peca cap dintre els bordes
            if (casellaSeleccionada[0] + i < 0 || casellaSeleccionada[0] + i >= 6 || casellaSeleccionada[1] + j < 0 || casellaSeleccionada[1] + j >= 6){
              return false;
            }

            //La pos no esta ocupada
            if (that.matriu[casellaSeleccionada[1] + j][casellaSeleccionada[0] + i] != 0){
              return false;
            }
          }
        }
      }

      //Colocar Peca
      let aux = 0;
      for (let i = -2; i < 2; i++){
        for (let j = -2; j < 2; j++){
          if (carta.val[j+2][i+2] != 0){
            if (!(casellaSeleccionada[1] + j == 0 || casellaSeleccionada[1] + j == 5 || casellaSeleccionada[0] + i == 0 || casellaSeleccionada[0] + i == 5)){
              aux++;
            }
            that.matriu[casellaSeleccionada[1] + j][casellaSeleccionada[0] + i] = carta.type;
            let sprite_aux = that.scene.add.sprite((casellaSeleccionada[0] + i)*50 + (that.x - 150 + 25) , (casellaSeleccionada[1] + j)*50 + (that.x - 150 + 25), 'fitxa', carta.type -1);
            sprite_aux.setScale(1.6);
            that.fitxesTauler.push(sprite_aux);
          }
        }
      }
      that.valors[carta.type] += aux;
      aux = that.scene.ma.cartes.indexOf(carta);
      that.scene.ma.cartes.splice(aux, 1);
      that.scene.ma.ordenarCartes();
      that.cartesUsades.push(carta);
      that.scene.ma.accions--;
      return true;
    }

    this.buidarTauler = function(){
      that.fitxesTauler.forEach(function(element){element.destroy()});
      that.fitxesTauler = [];

      that.cartesUsades.forEach(function(element){
        that.scene.deck.cartaUsada(element);
      })

      that.valors.forEach(function(element, index){ that.valors[index] = 0 });

      that.cartesUsades = [];
      that.scene.deck.barrejar();

      for(let i = 0; i < 6; i++){
        for(let j = 0; j < 6; j++){
          that.matriu[j][i] = 0;
        }
      }

    }

    this.finalTurn = function(){
      let complet = true;
      comprobarQuadratComplet:
      for (let i = 1; i < 5; i++){
        for (let j = 1; j < 5; j++){
          if(that.matriu[j][i] == 0){
            complet = false;
            break comprobarQuadratComplet;
          }
        }
      }

      if (complet){
        that.valors.forEach(function(element, index){ that.valors[index] *= 2; })
      }

      //Executar peces colocades
      that.wait(1000);
      console.log("Atac Foc");
      if (that.valors[1] >= 0){ //peces de foc
        that.scene.enemic.golpejat(that.valors[1]);
        that.wait(3000);
      }

      console.log("Defensa Gel");
      if (that.valors[2] > 0){ //peces de gel
        Globals.escut += that.valors[2];
        console.log(Globals.escut);
        that.scene.hud.updateCounter();
        that.wait(1000);
      }

      console.log("enverinar");
      if (that.valors[3] > 0){ //Peces de veri
        that.scene.enemic.enverinar(that.valors[3]);
        that.wait(1000);
      }

      console.log("Enemic");
      that.scene.enemic.executarAccio();
      that.wait(1000);

      console.log("nouTurn");
      this.buidarTauler();
      that.scene.ma.nouTurn();
      that.scene.enemic.nouTurn();
    }
  }
}

class BotoRobar extends Phaser.GameObjects.Sprite{
  constructor(scene, x, y, ma){
    super(scene, x, y, 'boto_robar');

    this.scene = scene;
    this.ma = ma;
    this.setInteractive();


    var that = this;
    this.on('pointerdown', function (event) {
      if (that.ma.accions > 0 && that.ma.cartes.length < 7 && that.scene.deck.pucRobarCarta()){
        that.ma.robarCarta();
        that.ma.accions--;
      }
    }, this);
  }


}

class BotoFinalTurn extends Phaser.GameObjects.Sprite{
  constructor(scene, x, y){
    super(scene, x, y, 'boto_final');
    this.scene = scene;
    var that = this;
    this.setInteractive();
    this.on('pointerdown', function (event) {
      that.scene.tauler.finalTurn();
    }, this);
  }
}
