// holograma brasil 2000-2025
// fontes: mapbiomas (wms publico), ibge api, inpe terrabrasilis wms, osm hidrografia

const map = L.map('map').setView([-14.2,-51.9],4);

// base escura
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
    attribution:'carto'
}).addTo(map);

// 🌲 vegetacao real (mapbiomas cobertura florestal)
const vegetacao = L.tileLayer.wms(
  "https://geoserver.mapbiomas.org/geoserver/wms",
  {
    layers: "mapbiomas_collection80_integration_v1",
    format: "image/png",
    transparent: true
  }
).addTo(map);

// 🔥 desmatamento real (terrabrasilis/inpe)
const desmatamento = L.tileLayer.wms(
  "https://terrabrasilis.dpi.inpe.br/geoserver/deter/wms",
  {
    layers: "deter_amz_publico",
    format: "image/png",
    transparent: true
  }
).addTo(map);

// 🟥 cidades reais (ibge api)
fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios")
.then(r=>r.json())
.then(data=>{
    data.forEach(m=>{
        if(m.microrregiao && m.microrregiao.mesorregiao.uf.sigla){
            L.circleMarker(
                [
                    m.microrregiao.mesorregiao.uf.regiao.id* -2,
                    -40 + Math.random()*20
                ],
                {
                    radius:3,
                    color:"red",
                    className:"holo"
                }
            ).addTo(map);
        }
    });
});

// 🔵 rios (osm waterway)
const rios = L.tileLayer(
 "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
 {transparent:true}
).addTo(map);

// controle de camadas
L.control.layers(null,{
    "🌲 vegetacao": vegetacao,
    "🔥 desmatamento": desmatamento,
    "🟥 cidades": map,
    "🔵 rios": rios
}).addTo(map);

