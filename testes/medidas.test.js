// Os numeros do README, presos.
//
// Cada valor aqui saiu do medidor, e os DERIVADOS (somas de coluna, razoes,
// porcentagens) passaram pelo `node -e` antes de entrar no arquivo. Estender uma
// curva com o olho ja custou cinco numeros errados num lote do acervo, todos
// dentro de arquivo de teste — o lugar que existe justamente para impedir chute.

import test from 'node:test'
import assert from 'node:assert/strict'

import {
  aberturas, classesDaGrade, classesCheias, cruzada,
  somaComControle, bomContraBurro, maisPecasPerde
} from '../js/medidas.js'

test('1xn: a classe de cada abertura em xadrez, de 2 a 14', () => {
  const esperado = ['N', 'N', 'N', 'R', 'P', 'R', 'N', 'N', 'N', 'R', 'N', 'R', 'N']
  const medido = aberturas(1, 2, 14).map((l) => l.classe)
  assert.deepEqual(medido, esperado)
})

test('na faixa impar, o lado com mais peca perde em 4 dos 6 tabuleiros', () => {
  const linhas = maisPecasPerde(13)
  assert.equal(linhas.length, 6)
  // O preto sempre entra com uma peca a mais na faixa de comprimento impar.
  for (const l of linhas) assert.equal(l.pretas, l.brancas + 1)
  const perdem = linhas.filter((l) => l.pretoPerde).map((l) => l.n)
  assert.deepEqual(perdem, [5, 7, 11, 13])
  assert.equal(perdem.length, 4)
  // Os dois que salvam a vantagem.
  assert.deepEqual(linhas.filter((l) => !l.pretoPerde).map((l) => l.n), [3, 9])
})

test('o 1x5 e R: tres pecas pretas contra duas brancas, e o preto perde', () => {
  const l = maisPecasPerde(5).find((x) => x.n === 5)
  assert.equal(l.desenho, '#O#O#')
  assert.equal(l.pretas, 3)
  assert.equal(l.brancas, 2)
  assert.equal(l.classe, 'R')
})

test('as quatro classes em todas as posicoes do 6x1 e do 8x1', () => {
  const a = classesDaGrade(6, 1)
  assert.equal(a.total, 729)
  assert.deepEqual(a.contagem, { N: 264, P: 311, L: 77, R: 77 })
  assert.equal(264 + 311 + 77 + 77, 729)

  const b = classesDaGrade(8, 1)
  assert.equal(b.total, 6561)
  assert.deepEqual(b.contagem, { N: 2622, P: 2245, L: 847, R: 847 })
  assert.equal(2622 + 2245 + 847 + 847, 6561)
})

test('as quatro classes em todas as 19.683 posicoes do 3x3', () => {
  const r = classesDaGrade(3, 3)
  assert.equal(r.total, 19683)
  assert.deepEqual(r.contagem, { N: 7702, P: 4457, L: 3762, R: 3762 })
  assert.equal(7702 + 4457 + 3762 + 3762, 19683)
})

test('L e R sao sempre iguais: a troca de cores e uma bijecao entre os dois', () => {
  for (const [w, h] of [[6, 1], [8, 1], [3, 3]]) {
    const c = classesDaGrade(w, h).contagem
    assert.equal(c.L, c.R, `${w}x${h}`)
  }
  for (const [w, h] of [[6, 1], [8, 1], [3, 3]]) {
    const c = classesCheias(w, h).contagem
    assert.equal(c.L, c.R, `${w}x${h} cheias`)
  }
})

test('nas posicoes cheias do 3x3, um lado ganhar sozinho e mais comum que N', () => {
  const r = classesCheias(3, 3)
  assert.equal(r.total, 512)
  assert.deepEqual(r.contagem, { N: 142, P: 50, L: 160, R: 160 })
  assert.equal(142 + 50 + 160 + 160, 512)
  // 320 contra 142: o tabuleiro cheio favorece um lado, nao quem comeca.
  assert.equal(r.contagem.L + r.contagem.R, 320)
  assert.ok(r.contagem.L + r.contagem.R > r.contagem.N)
})

test('as outras tabelas de posicao cheia', () => {
  const a = classesCheias(6, 1)
  assert.equal(a.total, 64)
  assert.deepEqual(a.contagem, { N: 32, P: 18, L: 7, R: 7 })
  assert.equal(32 + 18 + 7 + 7, 64)

  const b = classesCheias(8, 1)
  assert.equal(b.total, 256)
  assert.deepEqual(b.contagem, { N: 122, P: 54, L: 40, R: 40 })
  assert.equal(122 + 54 + 40 + 40, 256)
})

test('a troca de cores vale 2,00x exatos, sem uma posicao sobrando', () => {
  for (const [w, h] of [[8, 1], [3, 3]]) {
    const r = cruzada(w, h)
    assert.equal(r.celulas['nao/nao'], r.celulas['nao/sim'] * 2, `${w}x${h}`)
    assert.equal(r.ganhoCores, 2)
  }
})

test('as duas reducoes se multiplicam, com desvio zero', () => {
  const a = cruzada(8, 1)
  assert.deepEqual(a.celulas, { 'nao/nao': 13122, 'sim/nao': 6642, 'nao/sim': 6561, 'sim/sim': 3321 })
  assert.equal(a.ganhoJuntas.toFixed(2), '3.95')
  assert.equal(a.produtoDosGanhos.toFixed(2), '3.95')

  const b = cruzada(3, 3)
  assert.deepEqual(b.celulas, { 'nao/nao': 39366, 'sim/nao': 5724, 'nao/sim': 19683, 'sim/sim': 2862 })
  assert.equal(b.ganhoJuntas.toFixed(2), '13.75')
  assert.equal(b.produtoDosGanhos.toFixed(2), '13.75')
})

test('a simetria rende menos que o numero de imagens, porque ha posicao simetrica', () => {
  // 8 imagens no quadrado, mas o ganho medido e 6,88: as posicoes que sao iguais
  // a alguma imagem de si mesmas nao se multiplicam por 8.
  const b = cruzada(3, 3)
  assert.ok(b.ganhoSimetria < 8)
  assert.equal(b.ganhoSimetria.toFixed(2), '6.88')
  // No 8x1 as imagens que fazem efeito sao 2 (identidade e inversao).
  const a = cruzada(8, 1)
  assert.ok(a.ganhoSimetria < 2)
  assert.equal(a.ganhoSimetria.toFixed(2), '1.98')
})

test('P + (-P) e de segundo jogador em todas as posicoes testadas', () => {
  for (const [w, h, total] of [[4, 1, 81], [5, 1, 243], [3, 2, 729]]) {
    const r = somaComControle(w, h)
    assert.equal(r.total, total)
    assert.equal(r.espelho, total, `${w}x${h}`)
  }
})

test('o controle negativo derruba posicoes: o juiz nao aprova qualquer soma', () => {
  const quedas = []
  for (const [w, h] of [[4, 1], [5, 1], [3, 2]]) {
    const r = somaComControle(w, h)
    assert.ok(r.mesma < r.total, `${w}x${h}: P + P nao deveria passar em todas`)
    quedas.push(r.total - r.mesma)
  }
  assert.deepEqual(quedas, [16, 60, 296])
})

test('o motor bom e o burro nunca divergem, e o burro paga caro', () => {
  const r5 = bomContraBurro(5, 1)
  assert.equal(r5.total, 243)
  assert.equal(r5.divergencias, 0)
  assert.equal(r5.nosBom, 135)
  assert.equal(r5.nosBurro, 1050)

  const r32 = bomContraBurro(3, 2)
  assert.equal(r32.total, 729)
  assert.equal(r32.divergencias, 0)
  assert.equal(r32.nosBom, 216)
  assert.equal(r32.nosBurro, 5086)
  assert.equal((5086 / 216).toFixed(2), '23.55')
})
