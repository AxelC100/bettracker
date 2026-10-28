export const sports = [
  {
    "id": "football",
    "label": "Fútbol",
    "leagues": [
      "Premier League",
      "LaLiga",
      "Champions League",
      "Liga Promerica",
      "MLS"
    ]
  },
  {
    "id": "basketball",
    "label": "Baloncesto",
    "leagues": [
      "NBA",
      "WNBA",
      "NCAA",
      "EuroLeague",
      "Liga ACB"
    ]
  },
  {
    "id": "baseball",
    "label": "Béisbol",
    "leagues": [
      "MLB",
      "NPB",
      "KBO",
      "LMB",
      "LIDOM"
    ]
  }
]
export const markets = [
  {
    "id": "match-winner",
    "label": "Resultado 1X2",
    "sport": "football",
    "kind": "three-way",
    "player": false,
    "team": false,
    "auto": true,
    "hint": "Comprueba el periodo y las condiciones exactas de tu ticket."
  },
  {
    "id": "moneyline",
    "label": "Ganador · dos opciones",
    "sport": "football",
    "kind": "winner",
    "player": false,
    "team": false,
    "auto": true,
    "hint": "Comprueba el periodo y las condiciones exactas de tu ticket."
  },
  {
    "id": "double-chance",
    "label": "Doble oportunidad",
    "sport": "football",
    "kind": "double",
    "player": false,
    "team": false,
    "auto": true,
    "hint": "Comprueba el periodo y las condiciones exactas de tu ticket."
  },
  {
    "id": "draw-no-bet",
    "label": "Empate no apuesta",
    "sport": "football",
    "kind": "winner",
    "player": false,
    "team": false,
    "auto": true,
    "hint": "Comprueba el periodo y las condiciones exactas de tu ticket."
  },
  {
    "id": "goals",
    "label": "Total de goles",
    "sport": "football",
    "kind": "total",
    "player": false,
    "team": false,
    "auto": true,
    "hint": "Comprueba el periodo y las condiciones exactas de tu ticket."
  },
  {
    "id": "team-goals",
    "label": "Goles de un equipo",
    "sport": "football",
    "kind": "total",
    "player": false,
    "team": true,
    "auto": true,
    "hint": "Comprueba el periodo y las condiciones exactas de tu ticket."
  },
  {
    "id": "btts",
    "label": "Ambos equipos anotan",
    "sport": "football",
    "kind": "btts",
    "player": false,
    "team": false,
    "auto": true,
    "hint": "Comprueba el periodo y las condiciones exactas de tu ticket."
  },
  {
    "id": "handicap",
    "label": "Hándicap asiático",
    "sport": "football",
    "kind": "handicap",
    "player": false,
    "team": false,
    "auto": true,
    "hint": "Comprueba el periodo y las condiciones exactas de tu ticket."
  },
  {
    "id": "corners",
    "label": "Total de corners",
    "sport": "football",
    "kind": "total",
    "player": false,
    "team": false,
    "auto": false,
    "hint": "Registro disponible; liquidación manual por ahora."
  },
  {
    "id": "team-corners",
    "label": "Corners de equipo",
    "sport": "football",
    "kind": "total",
    "player": false,
    "team": true,
    "auto": false,
    "hint": "Registro disponible; liquidación manual por ahora."
  },
  {
    "id": "cards",
    "label": "Total de tarjetas",
    "sport": "football",
    "kind": "total",
    "player": false,
    "team": false,
    "auto": false,
    "hint": "Registro disponible; liquidación manual por ahora."
  },
  {
    "id": "shots",
    "label": "Tiros de jugador",
    "sport": "football",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "shots-on-target",
    "label": "Tiros a puerta de jugador",
    "sport": "football",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "player-goals",
    "label": "Goles de jugador",
    "sport": "football",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "player-assists",
    "label": "Asistencias de jugador",
    "sport": "football",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "correct-score",
    "label": "Marcador exacto",
    "sport": "football",
    "kind": "custom",
    "player": false,
    "team": false,
    "auto": false,
    "hint": "Registro disponible; liquidación manual por ahora."
  },
  {
    "id": "other",
    "label": "Otro mercado (texto libre)",
    "sport": "football",
    "kind": "custom",
    "player": false,
    "team": false,
    "auto": false,
    "hint": "Describe el mercado y la selección tal como aparecen en Stake."
  },
  {
    "id": "moneyline",
    "label": "Ganador · dos opciones",
    "sport": "basketball",
    "kind": "winner",
    "player": false,
    "team": false,
    "auto": true,
    "hint": "Comprueba el periodo y las condiciones exactas de tu ticket."
  },
  {
    "id": "three-way",
    "label": "Resultado · tres opciones",
    "sport": "basketball",
    "kind": "three-way",
    "player": false,
    "team": false,
    "auto": true,
    "hint": "Comprueba el periodo y las condiciones exactas de tu ticket."
  },
  {
    "id": "spread",
    "label": "Hándicap de puntos / spread",
    "sport": "basketball",
    "kind": "handicap",
    "player": false,
    "team": false,
    "auto": true,
    "hint": "Comprueba el periodo y las condiciones exactas de tu ticket."
  },
  {
    "id": "total-points",
    "label": "Total de puntos",
    "sport": "basketball",
    "kind": "total",
    "player": false,
    "team": false,
    "auto": true,
    "hint": "Comprueba el periodo y las condiciones exactas de tu ticket."
  },
  {
    "id": "team-points",
    "label": "Puntos de equipo",
    "sport": "basketball",
    "kind": "total",
    "player": false,
    "team": true,
    "auto": true,
    "hint": "Comprueba el periodo y las condiciones exactas de tu ticket."
  },
  {
    "id": "player-points",
    "label": "Puntos de jugador",
    "sport": "basketball",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "player-rebounds",
    "label": "Rebotes de jugador",
    "sport": "basketball",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "player-assists",
    "label": "Asistencias de jugador",
    "sport": "basketball",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "player-threes",
    "label": "Triples anotados de jugador",
    "sport": "basketball",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "player-pra",
    "label": "Puntos + rebotes + asistencias",
    "sport": "basketball",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "player-pr",
    "label": "Puntos + rebotes",
    "sport": "basketball",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "player-pa",
    "label": "Puntos + asistencias",
    "sport": "basketball",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "player-ra",
    "label": "Rebotes + asistencias",
    "sport": "basketball",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "player-steals",
    "label": "Robos de jugador",
    "sport": "basketball",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "player-blocks",
    "label": "Bloqueos de jugador",
    "sport": "basketball",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "player-turnovers",
    "label": "Pérdidas de balón de jugador",
    "sport": "basketball",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "double-double",
    "label": "Doble-doble",
    "sport": "basketball",
    "kind": "yesno",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "triple-double",
    "label": "Triple-doble",
    "sport": "basketball",
    "kind": "yesno",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "overtime",
    "label": "Habrá prórroga",
    "sport": "basketball",
    "kind": "yesno",
    "player": false,
    "team": false,
    "auto": false,
    "hint": "Registro disponible; liquidación manual por ahora."
  },
  {
    "id": "odd-even",
    "label": "Total de puntos par / impar",
    "sport": "basketball",
    "kind": "odd-even",
    "player": false,
    "team": false,
    "auto": true,
    "hint": "Comprueba el periodo y las condiciones exactas de tu ticket."
  },
  {
    "id": "other",
    "label": "Otro mercado (texto libre)",
    "sport": "basketball",
    "kind": "custom",
    "player": false,
    "team": false,
    "auto": false,
    "hint": "Describe el mercado y la selección tal como aparecen en Stake."
  },
  {
    "id": "moneyline",
    "label": "Ganador / moneyline",
    "sport": "baseball",
    "kind": "winner",
    "player": false,
    "team": false,
    "auto": true,
    "hint": "Comprueba el periodo y las condiciones exactas de tu ticket."
  },
  {
    "id": "three-way",
    "label": "Resultado · tres opciones",
    "sport": "baseball",
    "kind": "three-way",
    "player": false,
    "team": false,
    "auto": true,
    "hint": "Comprueba el periodo y las condiciones exactas de tu ticket."
  },
  {
    "id": "run-line",
    "label": "Run line / hándicap de carreras",
    "sport": "baseball",
    "kind": "handicap",
    "player": false,
    "team": false,
    "auto": true,
    "hint": "Comprueba el periodo y las condiciones exactas de tu ticket."
  },
  {
    "id": "total-runs",
    "label": "Total de carreras",
    "sport": "baseball",
    "kind": "total",
    "player": false,
    "team": false,
    "auto": true,
    "hint": "Comprueba el periodo y las condiciones exactas de tu ticket."
  },
  {
    "id": "team-runs",
    "label": "Carreras de equipo",
    "sport": "baseball",
    "kind": "total",
    "player": false,
    "team": true,
    "auto": true,
    "hint": "Comprueba el periodo y las condiciones exactas de tu ticket."
  },
  {
    "id": "first-inning-runs",
    "label": "Carreras en la primera entrada (YRFI / NRFI)",
    "sport": "baseball",
    "kind": "yesno",
    "player": false,
    "team": false,
    "auto": false,
    "hint": "Registro disponible; liquidación manual por ahora."
  },
  {
    "id": "pitcher-strikeouts",
    "label": "Ponches del lanzador",
    "sport": "baseball",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "pitcher-outs",
    "label": "Outs del lanzador",
    "sport": "baseball",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "pitcher-hits-allowed",
    "label": "Hits permitidos por lanzador",
    "sport": "baseball",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "pitcher-earned-runs",
    "label": "Carreras limpias permitidas",
    "sport": "baseball",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "pitcher-walks",
    "label": "Bases por bolas del lanzador",
    "sport": "baseball",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "batter-hits",
    "label": "Hits del bateador",
    "sport": "baseball",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "batter-total-bases",
    "label": "Bases totales del bateador",
    "sport": "baseball",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "batter-home-runs",
    "label": "Home runs del bateador",
    "sport": "baseball",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "batter-rbi",
    "label": "Carreras impulsadas (RBI)",
    "sport": "baseball",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "batter-runs",
    "label": "Carreras anotadas por bateador",
    "sport": "baseball",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "batter-stolen-bases",
    "label": "Bases robadas",
    "sport": "baseball",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "batter-hits-runs-rbi",
    "label": "Hits + carreras + RBI",
    "sport": "baseball",
    "kind": "total",
    "player": true,
    "team": false,
    "auto": false,
    "hint": "Requiere estadísticas y participación confirmadas; revisión manual."
  },
  {
    "id": "odd-even",
    "label": "Total de carreras par / impar",
    "sport": "baseball",
    "kind": "odd-even",
    "player": false,
    "team": false,
    "auto": true,
    "hint": "Comprueba el periodo y las condiciones exactas de tu ticket."
  },
  {
    "id": "other",
    "label": "Otro mercado (texto libre)",
    "sport": "baseball",
    "kind": "custom",
    "player": false,
    "team": false,
    "auto": false,
    "hint": "Describe el mercado y la selección tal como aparecen en Stake."
  }
]
export function getMarket(sport, id) { return markets.find(m => m.sport === sport && m.id === id) }
export function marketName(id) { return markets.find(m => m.id === id)?.label || ({ parlay:'Combinada', 'same-game':'Combinada del mismo partido' }[id]) || id }
export function periods(sport) {
 const common = [{ id:'full',label:'Partido completo' }]
 if (sport === 'football') return [...common,{id:'first-half',label:'Primer tiempo'},{id:'second-half',label:'Segundo tiempo'}]
 if (sport === 'basketball') return [...common,{id:'first-half',label:'Primera mitad'},{id:'second-half',label:'Segunda mitad'},...[1,2,3,4].map(n => ({id:`q${n}`,label:`Cuarto ${n}`}))]
 return [...common,{id:'first-5',label:'Primeras 5 entradas'},...[1,2,3,4,5,6,7,8,9].map(n => ({id:`inning-${n}`,label:`Entrada ${n}`}))]
}
