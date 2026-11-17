// Os casos caros: as duas faixas longas e a varredura de meio milhao.
//
// Ficam em arquivo separado porque sao minutos, nao segundos, e porque o CI
// roda este passo sozinho. O que esta aqui e o que sustenta os dois padroes do
// README, entao nao da para encolher sem encolher a afirmacao junto.

import test from 'node:test'
import assert from 'node:assert/strict'

import { aberturas, classesDaGrade, cruzada } from '../js/medidas.js'
import { grade, inicial } from '../js/nucleo.js'
import { Motor } from '../js/busca.js'

test('2xn: de segundo jogador exatamente nos multiplos de 3, de n=2 a n=11', () => {
  const linhas = aberturas(2, 2, 11)
  assert.equal(linhas.length, 10)
  for (const l of linhas) {
    const deveriaSerP = l.n % 3 === 0
    assert.equal(l.classe === 'P', deveriaSerP, `2x${l.n} deu ${l.classe}`)
  }
  assert.deepEqual(linhas.map((l) => l.classe),
    ['N', 'P', 'N', 'N', 'P', 'N', 'N', 'P', 'N', 'N'])
  // Os que sao P: 3, 6 e 9.
  assert.deepEqual(linhas.filter((l) => l.classe === 'P').map((l) => l.n), [3, 6, 9])
})

test('3xn: de segundo jogador exatamente nos pares, de n=3 a n=7', () => {
  const linhas = aberturas(3, 3, 7)
  assert.equal(linhas.length, 5)
  for (const l of linhas) {
    assert.equal(l.classe === 'P', l.n % 2 === 0, `3x${l.n} deu ${l.classe}`)
  }
  assert.deepEqual(linhas.map((l) => l.classe), ['N', 'P', 'N', 'P', 'N'])
})

test('o custo cresce rapido: o 2x11 abre mais de 3 milhoes de posicoes', () => {
  const linhas = aberturas(2, 2, 11)
  const n11 = linhas.find((l) => l.n === 11)
  assert.equal(n11.casas, 22)
  assert.equal(n11.nos, 3727431)
  const n10 = linhas.find((l) => l.n === 10)
  assert.equal(n10.nos, 571111)
  // Uma coluna a mais multiplica o custo por mais de seis.
  assert.ok(n11.nos / n10.nos > 6)
})

test('onde a parede esta: o 3x8 e o 2x12 tem 24 casas', () => {
  // O Map do V8 trava em 2^24 entradas, e foi ali que a medicao parou: o 3x8 e
  // o 2x12 nao terminam. NAO ponho a tentativa dentro do teste de proposito —
  // ela gasta minutos e gigabytes para morrer no mesmo lugar, e um teste que
  // provoca OOM de proposito quebra o CI por motivo que nao e o do projeto.
  // Aqui fica so o tamanho, que e o que explica a parede.
  assert.equal(grade(8, 3).casas, 24)
  assert.equal(grade(12, 2).casas, 24)
  // E o ultimo que TERMINOU, que e o que a tabela declara.
  assert.equal(grade(7, 3).casas, 21)
  assert.equal(grade(11, 2).casas, 22)
  const g = grade(7, 3)
  assert.equal(new Motor(g).classe(inicial(g)), 'N')
})

test('as 531.441 posicoes do 4x3, classe por classe', () => {
  const r = classesDaGrade(4, 3)
  assert.equal(r.total, 531441)
  assert.deepEqual(r.contagem, { N: 226442, P: 86133, L: 109433, R: 109433 })
  assert.equal(226442 + 86133 + 109433 + 109433, 531441)
  // P e a classe mais rara das quatro no 4x3: 16,21% das posicoes.
  assert.equal((86133 / 531441 * 100).toFixed(2), '16.21')
  assert.ok(r.contagem.P < r.contagem.L)
  assert.ok(r.contagem.P < r.contagem.N)
})

test('a tabela cruzada do 4x3 tambem da desvio zero', () => {
  const r = cruzada(4, 3)
  assert.deepEqual(r.celulas, { 'nao/nao': 1062882, 'sim/nao': 269730, 'nao/sim': 531441, 'sim/sim': 134865 })
  assert.equal(r.ganhoJuntas.toFixed(2), '7.88')
  assert.equal(r.produtoDosGanhos.toFixed(2), '7.88')
  assert.equal(r.ganhoCores, 2)
})
