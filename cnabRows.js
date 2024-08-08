'use strict';

import path from 'path';
import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import yargs from 'yargs';
import chalk from 'chalk';

const optionsYargs = yargs(process.argv.slice(2))
  .usage('Uso: $0 [options]')
  .option("f", { alias: "from", describe: "posição inicial de pesquisa da linha do Cnab", type: "number" })
  .option("t", { alias: "to", describe: "posição final de pesquisa da linha do Cnab", type: "number" })
  .option("s", { alias: "segmento", describe: "tipo de segmento", type: "string" })
  .option("p", { alias: "path", describe: "caminho para o arquivo CNAB", type: "string", default: 'cnabExample.rem' })
  .option("n", { alias: "nome", describe: "nome da empresa para pesquisar", type: "string" })
  .option("j", { alias: "json", describe: "exportar resultado para JSON", type: "boolean" })
  .example('$0 -f 21 -t 34 -s p', 'lista a linha e campo que from e to do cnab')
  .argv;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = optionsYargs.path ? path.resolve(optionsYargs.path) : path.resolve(`${__dirname}/cnabExample.rem`);

const { from, to, segmento, nome, json } = optionsYargs;

const extractInfoFromLine = (line, from, to) => {
  return {
    segment: line[13],
    info: line.substring(from - 1, to),
    line: line
  };
};

const searchSegment = (cnabArray, segmento, from, to) => {
  const results = cnabArray
    .filter(line => line[13].toLowerCase() === segmento.toLowerCase())
    .map(line => extractInfoFromLine(line, from, to));
  return results;
};

const searchByName = (cnabArray, nome) => {
  const results = cnabArray
    .filter(line => line.includes(nome.toUpperCase()))
    .map(line => ({
      nome: nome.toUpperCase(),
      endereco: line.substring(43, 73).trim(),
      cep: line.substring(73, 81).trim(),
      cidade: line.substring(81, 96).trim(),
      estado: line.substring(96, 98).trim(),
      linha: line
    }));
  console.log(results);
  return results;
};

const logSearchResults = (results) => {
  results.forEach(result => {
    console.log(chalk.blue(`Nome da Empresa: ${result.nome}`));
    console.log(chalk.green(`Endereço: ${result.endereco}, CEP: ${result.cep}, Cidade: ${result.cidade}, Estado: ${result.estado}`));
    console.log(chalk.yellow(`Linha completa: ${result.linha}`));
    console.log('-'.repeat(50));
  });
};

const exportToJson = async (results, fileName = 'cnab_output.json') => {
  const jsonContent = JSON.stringify(results, null, 2);
  await writeFile(path.resolve(__dirname, fileName), jsonContent);
  console.log(chalk.green(`Resultados exportados para ${fileName}`));
};

const processCnabFile = async () => {
  console.time('Leitura Async');
  try {
    const fileContent = await readFile(filePath, 'utf8');
    const cnabArray = fileContent.split('\n').filter(line => line.trim());

    if (segmento) {
      const segmentResults = searchSegment(cnabArray, segmento, from, to);
      segmentResults.forEach(result => {
        console.log(`Segmento: ${result.segment}`);
        console.log(`Info: ${result.info}`);
        console.log(`Linha: ${result.line}`);
        console.log('-'.repeat(50));
      });
    }

    if (nome) {
      const nameResults = searchByName(cnabArray, nome);
      logSearchResults(nameResults);
      if (json) {
        await exportToJson(nameResults);
      }
    }
  } catch (error) {
    console.error("Erro ao processar o arquivo:", error);
  }
  console.timeEnd('Leitura Async');
};

processCnabFile();
