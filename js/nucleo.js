// Clobber: as regras, e nada alem delas.
//
// O tabuleiro e uma grade largura x altura. Cada casa esta vazia, com uma peca
// PRETA ou com uma peca BRANCA. Guardo duas mascaras de bits, uma por cor: o bit
// k vale 1 quando a casa k tem peca daquela cor. As duas mascaras nunca se
// cruzam (`pretas & brancas === 0`), e o que sobra e casa vazia.
//
// A jogada e uma so: pego uma peca MINHA e empurro ela para uma casa vizinha
// (acima, abaixo, esquerda, direita) que tenha uma peca do ADVERSARIO. A peca
// dele sai do tabuleiro e a minha ocupa o lugar. Nao existe jogada para casa
// vazia, nem para casa da minha cor, nem na diagonal.
//
// Regra normal: quem nao tem jogada PERDE. Como toda jogada tira exatamente uma
// peca do tabuleiro, a partida acaba sempre, e em no maximo (pecas - 1) jogadas.
//
// Ate 30 casas as mascaras cabem num inteiro de 32 bits do JavaScript, e os
// tabuleiros deste projeto sao todos menores que isso. Acima de 30 casas as
// contas de bits do JS passam a mentir em silencio, entao `grade()` recusa.

export const PRETO = 0
export const BRANCO = 1

export const TETO_DE_CASAS = 30

/** Descreve uma grade: as dimensoes e a vizinhanca de cada casa, ja pronta. */
export function grade (largura, altura) {
  const casas = largura * altura
  if (casas > TETO_DE_CASAS) {
    throw new Error(`grade ${largura}x${altura} tem ${casas} casas; o teto e ${TETO_DE_CASAS}`)
  }
  const vizinhos = []
  for (let r = 0; r < altura; r++) {
    for (let c = 0; c < largura; c++) {
      let m = 0
      if (r > 0) m |= 1 << ((r - 1) * largura + c)
      if (r < altura - 1) m |= 1 << ((r + 1) * largura + c)
      if (c > 0) m |= 1 << (r * largura + c - 1)
      if (c < largura - 1) m |= 1 << (r * largura + c + 1)
      vizinhos.push(m)
    }
  }
  return { largura, altura, casas, vizinhos, todas: casas === 32 ? -1 : (1 << casas) - 1 }
}

/** O tabuleiro inicial: xadrez, preta na casa de indice par da linha. */
export function inicial (g) {
  let pretas = 0, brancas = 0
  for (let r = 0; r < g.altura; r++) {
    for (let c = 0; c < g.largura; c++) {
      const k = r * g.largura + c
      if ((r + c) % 2 === 0) pretas |= 1 << k
      else brancas |= 1 << k
    }
  }
  return { pretas, brancas }
}

/** Quantas pecas o tabuleiro tem ao todo. */
export function pecas (pos) {
  return conta(pos.pretas) + conta(pos.brancas)
}

export function conta (m) {
  m = m - ((m >>> 1) & 0x55555555)
  m = (m & 0x33333333) + ((m >>> 2) & 0x33333333)
  m = (m + (m >>> 4)) & 0x0f0f0f0f
  return (m * 0x01010101) >>> 24
}

/**
 * As jogadas de `quem`, cada uma como { de, para }.
 *
 * Para cada peca minha, olho as casas vizinhas que tem peca do adversario. Nao
 * ha jogada para casa vazia: em Clobber nao se anda, so se captura.
 */
export function jogadas (g, pos, quem) {
  const minhas = quem === PRETO ? pos.pretas : pos.brancas
  const dele = quem === PRETO ? pos.brancas : pos.pretas
  const saida = []
  let resto = minhas
  while (resto) {
    const bit = resto & -resto
    const de = Math.log2(bit >>> 0) | 0
    resto ^= bit
    let alvos = g.vizinhos[de] & dele
    while (alvos) {
      const b2 = alvos & -alvos
      saida.push({ de, para: Math.log2(b2 >>> 0) | 0 })
      alvos ^= b2
    }
  }
  return saida
}

/** So quero saber SE existe jogada: nao monto a lista a toa. */
export function temJogada (g, pos, quem) {
  const minhas = quem === PRETO ? pos.pretas : pos.brancas
  const dele = quem === PRETO ? pos.brancas : pos.pretas
  let resto = minhas
  while (resto) {
    const bit = resto & -resto
    const de = Math.log2(bit >>> 0) | 0
    if (g.vizinhos[de] & dele) return true
    resto ^= bit
  }
  return false
}

/** Aplica a jogada e devolve a posicao NOVA. A de entrada nao e tocada. */
export function aplica (pos, quem, jogada) {
  const bDe = 1 << jogada.de
  const bPara = 1 << jogada.para
  if (quem === PRETO) {
    return { pretas: (pos.pretas ^ bDe) | bPara, brancas: pos.brancas & ~bPara }
  }
  return { brancas: (pos.brancas ^ bDe) | bPara, pretas: pos.pretas & ~bPara }
}

/** O negativo do jogo: trocar as cores. Vale para a prova da soma. */
export function trocaCores (pos) {
  return { pretas: pos.brancas, brancas: pos.pretas }
}

/**
 * Chave da posicao, para memoria.
 *
 * A primeira versao era `pretas * 2^32 + brancas * 2 + quem`, com o comentario
 * "cabe em 60 bits ate 30 casas". Nao cabe: o JavaScript so guarda inteiros
 * exatos ate 2^53. Com 22 casas ou mais, `pretas * 2^32` pode passar disso, o
 * passo entre dois numeros representaveis vira 2, e o ultimo bit — quem esta na
 * vez — some. Aqui ele nao chegou a morder: a forma canonica escolhe a menor das
 * imagens e isso mantem `pretas` pequeno; o 2x11, refeito com chave em texto, deu
 * o mesmo N com os mesmos 3.727.431 nos. Mas o defeito existia. Agora o
 * deslocamento e o minimo que cabe, e acima de 26 casas a chave vira texto.
 */
export function chave (pos, quem, casas = 30) {
  if (casas <= 26) return (pos.pretas >>> 0) * Math.pow(2, casas + 1) + (pos.brancas >>> 0) * 2 + quem
  return `${pos.pretas >>> 0},${pos.brancas >>> 0},${quem}`
}

/** Desenha o tabuleiro em texto: # preta, O branca, . vazia. */
export function desenha (g, pos) {
  const linhas = []
  for (let r = 0; r < g.altura; r++) {
    let s = ''
    for (let c = 0; c < g.largura; c++) {
      const b = 1 << (r * g.largura + c)
      s += (pos.pretas & b) ? '#' : (pos.brancas & b) ? 'O' : '.'
    }
    linhas.push(s)
  }
  return linhas.join('\n')
}

/** Le um desenho de volta para posicao. Serve para os testes falarem claro. */
export function leDesenho (texto) {
  const linhas = texto.trim().split('\n').map((l) => l.trim())
  const altura = linhas.length
  const largura = linhas[0].length
  const g = grade(largura, altura)
  let pretas = 0, brancas = 0
  for (let r = 0; r < altura; r++) {
    if (linhas[r].length !== largura) throw new Error('linhas de larguras diferentes')
    for (let c = 0; c < largura; c++) {
      const ch = linhas[r][c]
      const k = r * largura + c
      if (ch === '#') pretas |= 1 << k
      else if (ch === 'O') brancas |= 1 << k
      else if (ch !== '.') throw new Error(`caractere ${ch} nao e # O nem .`)
    }
  }
  return { g, pos: { pretas, brancas } }
}

/**
 * As componentes conexas do tabuleiro, cada uma como mascara.
 *
 * Duas pecas estao na mesma componente quando ha um caminho de pecas vizinhas
 * entre elas. Casa vazia corta. Cresco a mascara em vez de empilhar casa por
 * casa: o `flood fill` com pilha ja custou caro em outro projeto do acervo.
 */
export function componentes (g, pos) {
  const ocupadas = pos.pretas | pos.brancas
  const saida = []
  let resto = ocupadas
  while (resto) {
    let frente = resto & -resto
    let comp = 0
    while (frente) {
      comp |= frente
      let viz = 0
      let f = frente
      while (f) {
        const b = f & -f
        viz |= g.vizinhos[Math.log2(b >>> 0) | 0]
        f ^= b
      }
      frente = viz & ocupadas & ~comp
    }
    saida.push(comp)
    resto &= ~comp
  }
  return saida
}
