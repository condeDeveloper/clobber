import test from 'node:test'
import assert from 'node:assert/strict'

import {
  PRETO, BRANCO, grade, inicial, jogadas, temJogada, aplica, trocaCores,
  pecas, conta, desenha, leDesenho, componentes, TETO_DE_CASAS
} from '../js/nucleo.js'
import { Motor, montaImagens, espalha } from '../js/busca.js'
import { MotorBurro, MotorDaSoma, somaEhZero, contasDaPartida, previsaoDasSolitarias } from '../js/juiz.js'

test('a grade recusa tabuleiro que nao cabe em 32 bits', () => {
  assert.doesNotThrow(() => grade(6, 5))
  assert.throws(() => grade(8, 4), /teto/)
  assert.equal(TETO_DE_CASAS, 30)
})

test('a abertura e um xadrez, e a casa de cima a esquerda e preta', () => {
  const g = grade(3, 2)
  assert.equal(desenha(g, inicial(g)), '#O#\nO#O')
  const g2 = grade(4, 1)
  assert.equal(desenha(g2, inicial(g2)), '#O#O')
})

test('ler um desenho e desenhar de volta da o mesmo texto', () => {
  const texto = '#O.\n.#O'
  const { g, pos } = leDesenho(texto)
  assert.equal(desenha(g, pos), texto)
})

test('nao existe jogada para casa vazia nem para casa da propria cor', () => {
  // O preto do meio tem uma casa vazia a esquerda e uma preta a direita.
  const { g, pos } = leDesenho('.##')
  assert.equal(jogadas(g, pos, PRETO).length, 0)
  assert.equal(temJogada(g, pos, PRETO), false)
})

test('a jogada e sempre em cima de peca do adversario, e na ortogonal', () => {
  const { g, pos } = leDesenho('#O\nO.')
  const dasPretas = jogadas(g, pos, PRETO)
  // A peca preta esta no canto 0 e tem duas brancas vizinhas: a 1 e a 2.
  assert.equal(dasPretas.length, 2)
  assert.deepEqual(dasPretas.map((j) => j.para).sort(), [1, 2])
  // A diagonal (casa 3) esta vazia e nao entra de jeito nenhum.
  assert.ok(!dasPretas.some((j) => j.para === 3))
})

test('toda jogada tira exatamente uma peca, e nunca uma peca minha', () => {
  const { g, pos } = leDesenho('#O#O\nO#O#')
  for (const quem of [PRETO, BRANCO]) {
    for (const j of jogadas(g, pos, quem)) {
      const dep = aplica(pos, quem, j)
      assert.equal(pecas(dep), pecas(pos) - 1)
      const minhasAntes = conta(quem === PRETO ? pos.pretas : pos.brancas)
      const minhasDepois = conta(quem === PRETO ? dep.pretas : dep.brancas)
      assert.equal(minhasDepois, minhasAntes)
    }
  }
})

test('a posicao de entrada nunca e modificada pela jogada', () => {
  const { g, pos } = leDesenho('#O#')
  const copia = { pretas: pos.pretas, brancas: pos.brancas }
  aplica(pos, PRETO, jogadas(g, pos, PRETO)[0])
  assert.deepEqual(pos, copia)
})

test('as pecas de cores diferentes nunca ocupam a mesma casa', () => {
  const { g, pos } = leDesenho('#O#\nO#O')
  const visitar = (p, quem, fundo) => {
    assert.equal(p.pretas & p.brancas, 0)
    if (fundo === 0) return
    for (const j of jogadas(g, p, quem)) visitar(aplica(p, quem, j), 1 - quem, fundo - 1)
  }
  visitar(pos, PRETO, 4)
})

test('quem nao tem jogada perde: um tabuleiro de uma peca so e de segundo jogador', () => {
  const { g, pos } = leDesenho('#')
  assert.equal(new Motor(g).classe(pos), 'P')
})

test('pecas da mesma cor encostadas nao se atacam', () => {
  const { g, pos } = leDesenho('##')
  assert.equal(new Motor(g).classe(pos), 'P')
  assert.equal(jogadas(g, pos, PRETO).length, 0)
  assert.equal(jogadas(g, pos, BRANCO).length, 0)
})

test('o tabuleiro de duas casas em xadrez e do primeiro jogador', () => {
  const { g, pos } = leDesenho('#O')
  assert.equal(new Motor(g).classe(pos), 'N')
})

test('tres casas #OO: o preto so tem uma jogada e ela entrega o jogo', () => {
  const { g, pos } = leDesenho('#OO')
  // Unica jogada do preto: ir para a casa 1. Depois disso o branco da casa 2
  // come a peca preta e o preto fica sem nada.
  assert.equal(jogadas(g, pos, PRETO).length, 1)
  assert.equal(new Motor(g).classe(pos), 'R')
})

test('trocar as cores troca os papeis: L vira R e N e P nao mudam', () => {
  const g = grade(4, 1)
  const m = new Motor(g)
  const troca = { L: 'R', R: 'L', N: 'N', P: 'P' }
  for (let n = 0; n < 81; n++) {
    let x = n, pretas = 0, brancas = 0
    for (let k = 0; k < 4; k++) {
      const d = x % 3; x = (x - d) / 3
      if (d === 1) pretas |= 1 << k
      else if (d === 2) brancas |= 1 << k
    }
    const pos = { pretas, brancas }
    assert.equal(m.classe(trocaCores(pos)), troca[m.classe(pos)])
  }
})

test('as imagens sao 4 num retangulo e 8 num quadrado', () => {
  assert.equal(montaImagens(grade(4, 3)).length, 4)
  assert.equal(montaImagens(grade(3, 3)).length, 8)
  assert.equal(montaImagens(grade(5, 1)).length, 4)
})

test('espalhar pela imagem identidade nao muda a mascara', () => {
  const g = grade(4, 3)
  const identidade = montaImagens(g)[0]
  assert.equal(espalha(0b101101, identidade), 0b101101)
})

test('as componentes separam o que a casa vazia corta', () => {
  const { g, pos } = leDesenho('#O.O#')
  const cs = componentes(g, pos)
  assert.equal(cs.length, 2)
  assert.deepEqual(cs.map((c) => conta(c)).sort(), [2, 2])
})

test('uma componente so quando nao ha casa vazia', () => {
  const g = grade(4, 3)
  assert.equal(componentes(g, inicial(g)).length, 1)
})

test('posicao em que toda componente tem uma peca so e de segundo jogador', () => {
  const { g, pos } = leDesenho('#.O.#')
  assert.equal(previsaoDasSolitarias(g, pos), 'P')
  assert.equal(new Motor(g).classe(pos), 'P')
})

test('a previsao barata se cala quando nao se aplica', () => {
  const { g, pos } = leDesenho('#O')
  assert.equal(previsaoDasSolitarias(g, pos), null)
})

test('a partida acaba, e em no maximo pecas - 1 jogadas', () => {
  const g = grade(4, 2)
  const r = contasDaPartida(g, inicial(g), PRETO)
  assert.equal(r.ok, true)
  assert.equal(r.comeco, 8)
  assert.equal(r.teto, 7)
  assert.ok(r.feitas <= r.teto, `${r.feitas} jogadas, teto ${r.teto}`)
})

test('a soma de uma posicao com o espelho dela e de segundo jogador', () => {
  const g = grade(4, 1)
  const m = new MotorDaSoma(g)
  for (let n = 0; n < 81; n++) {
    let x = n, pretas = 0, brancas = 0
    for (let k = 0; k < 4; k++) {
      const d = x % 3; x = (x - d) / 3
      if (d === 1) pretas |= 1 << k
      else if (d === 2) brancas |= 1 << k
    }
    assert.equal(somaEhZero(g, { pretas, brancas }, m), true)
  }
})

test('o motor bom e o motor burro concordam nas 729 posicoes do 3x2', () => {
  const g = grade(3, 2)
  const bom = new Motor(g)
  const burro = new MotorBurro(g)
  for (let n = 0; n < 729; n++) {
    let x = n, pretas = 0, brancas = 0
    for (let k = 0; k < 6; k++) {
      const d = x % 3; x = (x - d) / 3
      if (d === 1) pretas |= 1 << k
      else if (d === 2) brancas |= 1 << k
    }
    const pos = { pretas, brancas }
    assert.equal(bom.classe(pos), burro.classe(pos))
  }
})
