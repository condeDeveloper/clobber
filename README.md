# Clobber

Clobber resolvido por varredura de tabuleiro inteiro, em JavaScript puro, sem dependência nenhuma.

As regras cabem em três linhas. O tabuleiro começa em xadrez, preta e branca alternadas. Na sua vez você empurra uma peça sua para cima de uma peça vizinha do adversário, e a dele sai do jogo. Quem fica sem jogada perde.

Não há como passar, não há empate, e cada jogada tira exatamente uma peça: a partida acaba sempre, em no máximo `peças − 1` jogadas.

**Página jogável:** <https://condedeveloper.github.io/clobber/>

---

## Os quatro achados

**1. Ter mais peça não é vantagem.** Na faixa `1×n` de comprimento ímpar a abertura dá uma peça a mais para as pretas. Em **4 dos 6** tabuleiros medidos essa vantagem termina em derrota: `1×5`, `1×7`, `1×11` e `1×13` são todos **R**, vitória das brancas. Só o `1×3` e o `1×9` salvam o material. O `1×5` é `#O#O#`: três peças contra duas, e o lado de três perde.

**2. Dois padrões limpos, cada um parando onde a medida parou.** No `2×n` a abertura é de segundo jogador **exatamente nos múltiplos de 3**, medido de `n=2` a `n=11`. No `3×n` é de segundo jogador **exatamente nos pares**, medido de `n=3` a `n=7`. As duas faixas param em 24 casas, onde o `Map` do JavaScript trava em 2²⁴ entradas.

**3. As duas reduções da busca se multiplicam, com desvio zero.** A simetria do retângulo rende 6,88× no `3×3`; a troca de cores rende 2,00× exatos; as duas juntas rendem **13,75×**, que é o produto das duas, com desvio `0,0000`. O mesmo acontece no `8×1` (1,98 × 2,00 = 3,95) e no `4×3` (3,94 × 2,00 = 7,88).

**4. A prova da soma passa em tudo, e o controle negativo mostra que ela mede.** `P + (−P)` é posição de segundo jogador em **100%** das posições de todos os tabuleiros testados. Trocar o espelho pela própria posição derruba **16 de 81** no `1×4`, **60 de 243** no `1×5` e **296 de 729** no `2×3`.

---

## O que é a classe de uma posição

Clobber é um jogo **partidário**: as pretas só mexem peça preta e as brancas só mexem peça branca, então os dois lados não têm as mesmas jogadas. Isso muda o que dá para perguntar. Num jogo imparcial basta saber se a posição é ganha ou perdida para quem está na vez. Aqui são duas perguntas, uma para cada lado começando, e o par das duas dá a classe:

| classe | o que significa |
| --- | --- |
| **N** | ganha quem joga primeiro |
| **P** | ganha quem joga por último |
| **L** | ganham as pretas, comece quem começar |
| **R** | ganham as brancas, comece quem começar |

---

## As tabelas

Todos os números abaixo saem de `node ferramentas/medidor.js` e estão presos em `testes/medidas.test.js`. Nenhum foi digitado à mão.

### A abertura em xadrez

| tabuleiro | classe | nós abertos |
| --- | --- | --- |
| `1×5` | R | 13 |
| `1×9` | N | 99 |
| `1×13` | R | 1.210 |
| `2×9` | P | 242.087 |
| `2×11` | N | 3.727.431 |
| `3×6` | P | 374.082 |
| `3×7` | N | 3.957.539 |
| `2×12`, `3×8` | **não medido** | 24 casas, o `Map` estoura |

Sequência completa do `1×n`, de 2 a 14: `N N N R P R N N N R N R N`.

### As quatro classes, varrendo todas as 3^casas posições

| tabuleiro | posições | N | P | L | R |
| --- | --- | --- | --- | --- | --- |
| `6×1` | 729 | 264 | 311 | 77 | 77 |
| `8×1` | 6.561 | 2.622 | 2.245 | 847 | 847 |
| `3×3` | 19.683 | 7.702 | 4.457 | 3.762 | 3.762 |
| `4×3` | 531.441 | 226.442 | 86.133 | 109.433 | 109.433 |

`L` e `R` saem sempre iguais, e isso não é coincidência: trocar as cores é uma bijeção entre os dois conjuntos. É a conferência mais barata do projeto, e roda em toda tabela.

### Só as posições cheias, sem casa vazia

| tabuleiro | posições | N | P | L | R |
| --- | --- | --- | --- | --- | --- |
| `6×1` | 64 | 32 | 18 | 7 | 7 |
| `8×1` | 256 | 122 | 54 | 40 | 40 |
| `3×3` | 512 | 142 | 50 | **160** | **160** |
| `4×3` | 4.096 | 1.498 | 440 | 1.079 | 1.079 |

No `3×3` cheio, um lado ganhar sozinho (320 posições) é mais comum que o primeiro jogador ganhar (142).

### A tabela cruzada das reduções

| tabuleiro | nenhuma | só simetria | só cores | as duas | produto |
| --- | --- | --- | --- | --- | --- |
| `8×1` | 13.122 | 6.642 (1,98×) | 6.561 (2,00×) | 3.321 (3,95×) | 3,95× |
| `3×3` | 39.366 | 5.724 (6,88×) | 19.683 (2,00×) | 2.862 (13,75×) | 13,75× |
| `4×3` | 1.062.882 | 269.730 (3,94×) | 531.441 (2,00×) | 134.865 (7,88×) | 7,88× |

Medir uma otimização de cada vez e somar os ganhos no papel é um erro que já custou caro em outro projeto deste acervo, onde a ordem que era a melhor com a poda ligada era a pior sem ela. Por isso as quatro células são medidas, não duas.

---

## Os três juízes

Nenhum deles compartilha código com a busca.

**`MotorBurro`** responde a mesma pergunta sem memória, sem simetria e sem troca de cores. Zero divergências em 243, 729 e 2.187 posições, pagando 7,78×, 23,55× e 13,44× mais nós.

**`MotorDaSoma`** joga a partida em dois tabuleiros ao mesmo tempo. O negativo de um jogo é o jogo com os papéis trocados, e em Clobber isso é literal: trocar as cores. A teoria obriga `P + (−P)` a ser de segundo jogador, e isso é verificado **jogando** a soma inteira, sem calcular valor de jogo nenhum.

**`contasDaPartida`** não olha quem ganha: confere que toda jogada tira exatamente uma peça, que ninguém perde peça própria, e que a partida acaba dentro do teto.

---

## O que as medidas me corrigiram

**Escrevi "52 testes" no README antes de contar.** Contado por programa, eram 42. É exatamente o tipo de número que o arquivo de testes existe para impedir que eu chute — e eu chutei no README.

**Deixei o medidor pedir o que não termina.** A primeira versão varria o 2×n até 12 e o 3×n até 8. As duas faixas têm 24 casas no fim, estouram o `Map` do JavaScript, e a rodada gastava minutos para morrer no mesmo lugar. A faixa agora para no último tabuleiro que **terminou**, e o README diz onde a parede está.

**Quase pus um teste que provoca OOM de propósito.** Ia prender a parede do `Map` com um `assert.throws`. O teste passaria gastando minutos e gigabytes, e qualquer aperto de memória no CI viraria falha com cara de erro do projeto. O tamanho das 24 casas conta a mesma história de graça.

**A prova da soma nunca discordou, e isso me incomodou.** Juiz que aprova tudo pode não estar medindo nada. O controle negativo — somar a posição consigo mesma em vez do espelho — derruba 16 de 81 no 1×4, e foi isso que mostrou que a prova mede.

O resto da tabela saiu certo de primeira. O 1×5 ser vitória das brancas me surpreendeu, mas eu não tinha apostado por escrito antes de medir, então não conto como acerto nem como erro.

---

## Como rodar

Node 20 ou mais novo. Sem dependência.

```bash
npm test                              # a suite inteira
npm run medir                         # todas as tabelas
node ferramentas/medidor.js cruzada   # uma tabela so
node ferramentas/medidor.js soma      # a prova da soma e o controle negativo
```

## Os arquivos

- `js/nucleo.js` — as regras e nada mais: tabuleiro, jogadas, componentes conexas.
- `js/busca.js` — quem ganha, com memória e as duas reduções.
- `js/juiz.js` — os três juízes, sem compartilhar código com a busca.
- `js/medidas.js` — as tabelas do README, cada uma calculada uma vez só.
- `js/app.js` — a página jogável, usando o mesmo motor.
- `ferramentas/medidor.js` — imprime as tabelas.
- `testes/` — 42 testes, com os números do README presos.

## Licença

MIT.
