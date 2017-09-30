const replaceBARS = (textToRefactor) => {
  const startBARS = /\{\{/
  const endBARS   = /\}\}/
  const period    = /\./

  if( startBARS.test(textToRefactor) ){
    const start = startBARS.exec(textToRefactor).index
    const end   = endBARS.exec(textToRefactor.slice(start) ).index + start
    const id    = textToRefactor.slice(start+3, end-1)

    if( id.includes('.') ){
      let index = period.exec(id).index 
      const first  = id.slice(0,index)
      const second = id.slice(index+1)
      if( second.includes('.') ){
        index = period.exec(second).index
        const secondSecond = second.slice(0, index)
        const third = second.slice(index+1)
        console.log("39", first, secondSecond, third)
        // no test for data validity here
        var data = dataStore[first][secondSecond][third]
      }
      else { 
        if( dataStore[first] !== undefined && dataStore[first][second] !== undefined ){
          data = dataStore[first][second]
        }
        else { 
          data = "error no data"
        }
      }
    }
    else if( dataStore[id] !== undefined ) {
       data = dataStore[id]
    }else {
       data = " "
    }
    let newHTML = textToRefactor.slice(0, start)
    newHTML += data
    if( textToRefactor.length >= (end+2) ) {
      newHTML += textToRefactor.slice(end+2)
      //console.log("newHTML", newHTML)
    }
    return newHTML
  }
  return textToRefactor
}
const forEachBARS = (textToRefactor, name, i) => {
  const BARSlbELSE = /\{\{\#else\}\}/
  const BARSlbIF   = /\{\{\#if/
  const BARSescIF  = /\{\{\/if\}\}/
  const startBARS  = /\{\{/
  const endBARS    = /\}\}/
  const period     = /\./
  let count        = 0
  let hideHTML     = ''
  let results      = []
  let processText  = textToRefactor

  while( startBARS.test(processText) ){
    if( BARSlbIF.test( processText ) &&
        BARSlbIF.exec(processText ).index === startBARS.exec(processText).index ) {
       results = hideBARSesc(processText)
       console.log(processText)
       hideHTML += results[0]
       processText = results[1]
       //console.log(results)
    }
    if( BARSlbELSE.test( processText ) &&
        BARSlbELSE.exec(processText ).index === startBARS.exec(processText).index ) {
       results = hideBARSesc(processText)
       console.log(processText)
       hideHTML += results[0]
       processText = results[1]
       //console.log(results)
    }
    if( BARSescIF.test( processText ) &&
        BARSescIF.exec(processText ).index === startBARS.exec(processText).index ) {
       results = hideBARSesc(processText)
       hideHTML += results[0]
       processText = results[1]
       //console.log(results)
    }
    if( !startBARS.test(processText) ) {
      return hideHTML + processText
      break;
    }
    if( count++ > 1000 ){
       console.log("loop Error")
       break;
    }
    let start = startBARS.exec(processText).index
    let end   = endBARS.exec(processText.slice(start)).index + start
    let id    = processText.slice(start+3, end-1)
    console.log("98 id",id)
    if( id == '@index') {
      data = i
    }
    else if( id == 'this' ) {
      data = dataStore[name][i]
    }
    else if( dataStore[name][i][id] !== undefined ) {
      data = dataStore[name][i][id]
    }
    else if( id.includes('.') ){
      let index = period.exec(id).index 
      const first = id.slice(0,index)
      const second = id.slice(index+1)
      if( second.includes('.') ){
        index = period.exec(second).index
        const secondSecond = second.slice(0, index)
        const third = second.slice(index+1)
        console.log("39", first, secondSecond, third)
        var data = dataStore[name][i][first][secondSecond][third]
      }
      else { 
        if( dataStore[name][i][first] !== undefined && dataStore[name][i][first][second] !== undefined ){
          data = dataStore[name][i][first][second]
        }
        else { 
          data = "error no data"
        }
      }
    }
    else {
      data = " "
    }
    var newHTML = processText.slice(0, start)
    newHTML += data
    newHTML += processText.slice(end+2)
    processText = newHTML
  }
  //console.log(hideHTML+processText)
  return hideHTML+processText
}
const hideBARSesc = (textToRefactor) => {
  const BARSlbELSE = /\{\{\#else\}\}/
  const BARSlbIF   = /\{\{\#if/
  const BARSescIF  = /\{\{\/if\}\}/
  const startBARS  = /\{\{/
  const endBARS    = /\}\}/
  let processText  = textToRefactor
 
  if( BARSlbIF.test(processText) ) {
    const startLB = BARSlbIF.exec(processText).index
    return [processText.slice(0, startLB+5), processText.slice(startLB+5)]
  }
  if( BARSlbELSE.test(processText) ) {
    const startLB = BARSlbELSE.exec(processText).index
    return [processText.slice(0, startLB+9), processText.slice(startLB+9)]
  }
  if( BARSescIF.test(processText) ) {
    const startESC = BARSescIF.exec(processText).index
    return [processText.slice(0, startESC+7), processText.slice(startESC+7)]
  }
}
const replaceBARSeach = (textToProcess) => {
  //let testText = '{{#each true }}Hello {{ lastName }}{{/each}}‘ 
  const startBARSeach = /\{\{\#each/ 
  const endBARSeach   = /\{\{\/each\}\}/ 
  const startBARS     = /\{\{/ 
  const endBARS       = /\}\}/ 

  if( startBARSeach.test(textToProcess) ) { 
    const startOfEach = startBARSeach.exec(textToProcess).index 
    const endBARSafterEach = endBARS.exec(textToProcess.slice(startOfEach)).index+startOfEach
    const endOfEach = endBARSeach.exec(textToProcess).index 
    const name = textToProcess.slice(startOfEach + 8 , endBARSafterEach-1) 
    const innerText = textToProcess.slice(endBARSafterEach+2, endOfEach) 
    if( dataStore[name].length > 0 ){ 
      var newText = textToProcess.slice(0, startOfEach) 
      dataStore[name].forEach( (v, i) => {
      //for(let i = 0; i < dataStore[name].length; i++ ){
        newText += forEachBARS(innerText, name, i) + '<br>'
      })
      newText += textToProcess.slice(endOfEach+9) 
    }
    else{ 
       newText = textToProcess.slice(0, startOfEach)
       newText += textToProcess.slice(endOfEach+9)
       console.log(false) 
    }
    //console.log('184 BAReach', newText)
    return newText
  }
  return textToProcess 
}

//let html = replaceBARSeach( "{{#each names }}Hello {{ lastName }} {{ firstName }} {{/each}}" ) 
//console.log(html)
const replaceBARSif = (textToProcess) => {
  const BARSlbELSE  = /\{\{\#else\}\}/
  const startBARSif = /\{\{\#if/ 
  const endBARSif   = /\{\{\/if\}\}/ 
  const startBARS   = /\{\{/ 
  const endBARS     = /\}\}/ 

  if( startBARSif.test(textToProcess) ) { 
    const startOfIf      = startBARSif.exec(textToProcess).index 
    const endBARSafterIf = endBARS.exec(textToProcess.slice(startOfIf)).index+startOfIf 
    const endOfIf        = endBARSif.exec(textToProcess).index 
    let conditionText    = textToProcess.slice(startOfIf + 6, endBARSafterIf-1) 
    let innerText        = textToProcess.slice(endBARSafterIf+2, endOfIf)
    if( startBARS.test( conditionText) ) {
      conditionText += ' }}'
      innerText = innerText.slice(3)
    }
    let newText  = textToProcess.slice(0, startOfIf)
    let ifText   = replaceBARS(innerText)
    let elseText = ''
    if( BARSlbELSE.exec(innerText) ) {
       const startOfElse = BARSlbELSE.exec(innerText).index
       ifText   = replaceBARS(innerText.slice(0, startOfElse))
       elseText = replaceBARS(innerText.slice(startOfElse+9))
       console.log("227-if",ifText, "else",elseText)
    }
    if( eval(conditionText) ){  
      newText += ifText
      newText += textToProcess.slice(endOfIf+8)
      console.log("231", true) 
    } 
    else{ 
      newText += elseText
      newText += textToProcess.slice(endOfIf+8) 
      console.log("236",false) 
    } 
    return newText 
  } 
  return textToProcess 
}
const processBARS = (html) => {
  let processedHTML = html
  const startBARS = /\{\{/
  if( startBARS.test(processedHTML) ){
    while(startBARS.test(processedHTML) ){
      processedHTML = replaceBARS(processedHTML)
    }
  }
  return processedHTML
}

const processIF = (html) => {
  let processedHTML = html
  const startIF = /\{\{\#if/
  if( startIF.test(processedHTML) ){
    while(startIF.test(processedHTML) ){
      processedHTML = replaceBARSif(processedHTML)
    }
  }
  return processedHTML
}

const processEACH = (html) => {
  const startEACH = /\{\{\#each/
  let processedHTML = html
  if( startEACH.test(processedHTML) ){
    while(startEACH.test(processedHTML) ){
      //console.log('249', processedHTML)
      processedHTML = replaceBARSeach(processedHTML)
    }
  }
  return processedHTML
}

const compileHTML = (html) => {
   let processedHTML = processEACH(html)
   processedHTML     = processIF(processedHTML)
   processedHTML     = processBARS(processedHTML)
   return processedHTML
}
const renderHTML = (html, myDiv='myDiv') => {
  document.getElementById(myDiv).innerHTML = html
}
//Main
//const originalHTML = new Runner().returnValue('HTMLtodo') 
//const originalHTML = document.getElementById('myDiv').innerHTML
//You will need to provide an div on your page with the id of myDiv


//renderHTML(compileHTML(originalHTML))
