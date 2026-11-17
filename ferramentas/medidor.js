#!/usr/bin/env node
// O medidor. Roda as tabelas e cospe os numeros que vao para o README.
//
//   node ferramentas/medidor.js            todas
//   node ferramentas/medidor.js aberturas  quem ganha a abertura em xadrez
//   node ferramentas/medidor.js material   onde ter mais peca termina em derrota
//   node ferramentas/medidor.js classes    as quatro classes em todas as posicoes
//   node ferramentas/medidor.js cheias     idem, so nas posicoes sem casa vazia
//   node ferramentas/medidor.js cruzada    a tabela cruzada das duas reducoes
//   node ferramentas/medidor.js soma       a prova da soma e o controle negativo
//   node ferramentas/medidor.js duelo      o motor bom contra o motor burro

import {
  aberturas, classesDaGrade, classesCheias, cruzada,
  somaComControle, bomContraBurro, maisPecasPerde
} from '../js/medidas.js'

const n = (x) => x === null || x === undefined ? '-' : x.toLocaleString('pt-BR')
const pad = (s, w) => String(s).padStart(w)

function tabelaAberturas () {
  console.log('\n== a abertura em xadrez ==')
  // As faixas param onde a MEDIDA parou, nao onde a curiosidade acaba: o 2x12
  // (24 casas) e o 3x8 (24 casas) estouram o Map do JS, que trava em 2^24
  // entradas. Tentar de novo aqui so faria a suite gastar minutos para morrer
  // no mesmo lugar, entao a faixa fica no ultimo que TERMINOU e o README diz
  // onde a parede esta.
  for (const [altura, de, ate, rotulo] of [[1, 2, 14, '1 x n'], [2, 2, 11, '2 x n'], [3, 3, 7, '3 x n']]) {
    console.log(`\n  ${rotulo}`)
    for (const l of aberturas(altura, de, ate)) {
      if (l.parou) { console.log(`   n=${pad(l.n, 2)}  ${pad(l.casas, 2)} casas  NAO MEDIDO: ${l.parou}`); continue }
      console.log(`   n=${pad(l.n, 2)}  ${pad(l.casas, 2)} casas  ${l.classe}  ${pad(n(l.nos), 12)} nos`)
    }
  }
  console.log('\n  N = ganha quem joga primeiro | P = ganha quem joga por ultimo')
  console.log('  L = o preto ganha de qualquer jeito | R = o branco ganha de qualquer jeito')
}

function tabelaMaterial () {
  console.log('\n== faixa impar: o preto entra com uma peca a mais ==')
  for (const l of maisPecasPerde(13)) {
    console.log(`   1x${pad(l.n, 2)}  ${pad(l.desenho, 14)}  ${l.pretas} pretas x ${l.brancas} brancas  ->  ${l.classe}${l.pretoPerde ? '   <- o lado com MAIS peca perde' : ''}`)
  }
}

function tabelaClasses () {
  console.log('\n== as quatro classes em TODAS as posicoes (3^casas) ==')
  for (const [w, h] of [[6, 1], [8, 1], [3, 3], [4, 3]]) {
    const r = classesDaGrade(w, h)
    const c = r.contagem
    console.log(`   ${w}x${h}  ${pad(n(r.total), 9)} posicoes   N ${pad(n(c.N), 8)}  P ${pad(n(c.P), 7)}  L ${pad(n(c.L), 7)}  R ${pad(n(c.R), 7)}   (${n(r.guardadas)} guardadas)`)
  }
  console.log('   L e R saem sempre iguais: trocar as cores e uma bijecao entre os dois conjuntos.')
}

function tabelaCheias () {
  console.log('\n== so as posicoes cheias, sem casa vazia (2^casas) ==')
  for (const [w, h] of [[6, 1], [8, 1], [3, 3], [4, 3]]) {
    const r = classesCheias(w, h)
    const c = r.contagem
    console.log(`   ${w}x${h}  ${pad(n(r.total), 7)} posicoes   N ${pad(n(c.N), 6)}  P ${pad(n(c.P), 5)}  L ${pad(n(c.L), 5)}  R ${pad(n(c.R), 5)}`)
  }
}

function tabelaCruzada () {
  console.log('\n== tabela cruzada: simetria do tabuleiro x troca de cores ==')
  console.log('   (nos visitados varrendo todas as posicoes da grade)')
  for (const [w, h] of [[8, 1], [3, 3], [4, 3]]) {
    const r = cruzada(w, h)
    console.log(`\n   ${w}x${h}`)
    console.log(`     nenhuma das duas : ${pad(n(r.celulas['nao/nao']), 10)}`)
    console.log(`     so simetria      : ${pad(n(r.celulas['sim/nao']), 10)}   ${r.ganhoSimetria.toFixed(2)}x`)
    console.log(`     so cores         : ${pad(n(r.celulas['nao/sim']), 10)}   ${r.ganhoCores.toFixed(2)}x`)
    console.log(`     as duas          : ${pad(n(r.celulas['sim/sim']), 10)}   ${r.ganhoJuntas.toFixed(2)}x`)
    console.log(`     produto dos ganhos separados: ${r.produtoDosGanhos.toFixed(2)}x   (desvio ${(r.ganhoJuntas - r.produtoDosGanhos).toFixed(4)})`)
  }
}

function tabelaSoma () {
  console.log('\n== a prova da soma, com controle negativo ==')
  for (const [w, h] of [[4, 1], [5, 1], [3, 2]]) {
    const r = somaComControle(w, h)
    console.log(`   ${w}x${h}  ${pad(n(r.total), 5)} posicoes   P + (-P) de segundo jogador: ${pad(n(r.espelho), 5)}   P + P: ${pad(n(r.mesma), 5)}`)
  }
  console.log('   A primeira coluna tem de bater com o total. A segunda nao: se batesse,')
  console.log('   o teste aprovaria qualquer soma e nao estaria medindo nada.')
}

function tabelaDuelo () {
  console.log('\n== o motor bom contra o motor burro ==')
  for (const [w, h] of [[5, 1], [3, 2], [7, 1]]) {
    const r = bomContraBurro(w, h)
    console.log(`   ${w}x${h}  ${pad(n(r.total), 6)} posicoes   divergencias: ${r.divergencias}   nos bom ${pad(n(r.nosBom), 8)}  nos burro ${pad(n(r.nosBurro), 10)}`)
  }
}

const partes = {
  aberturas: tabelaAberturas,
  material: tabelaMaterial,
  classes: tabelaClasses,
  cheias: tabelaCheias,
  cruzada: tabelaCruzada,
  soma: tabelaSoma,
  duelo: tabelaDuelo
}

const pedido = process.argv[2]
if (!pedido) {
  for (const f of Object.values(partes)) f()
} else if (partes[pedido]) {
  partes[pedido]()
} else {
  console.error(`nao conheco "${pedido}". conheco: ${Object.keys(partes).join(', ')}`)
  process.exit(1)
}
