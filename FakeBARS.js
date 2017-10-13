let runBank = [{}]
let dataStore = []
const replaceBARS = (textToRefactor) => {
  const startBARS = /\{\{/
  const endBARS   = /\}\}/
  const period    = /\./

  if( startBARS.test(textToRefactor) ){
    const start    = startBARS.exec(textToRefactor).index
    const end      = endBARS.exec(textToRefactor.slice(start) ).index + start
    const varKey   = textToRefactor.slice(start+3, end-1)
    const splitKey = varKey.split('.')
    let objVar = dataStore
    for(let i = 0; i< splitKey.length; i++){
      if( objVar[splitKey[i]] !== undefined ) {
         objVar=objVar[splitKey[i]]
      } else {
        console.log("DATA ERROR:", splitKey, splitKey[i])
        objVar = ""
      }
    }
    let newHTML = textToRefactor.slice(0, start)
    newHTML += objVar
    if( textToRefactor.length >= (end+2) ) {
      newHTML += textToRefactor.slice(end+2)
    }
    runBank.push({type: "replaceBARS", varKey: varKey, value: objVar, newHTML: [newHTML]})
    return newHTML
  }
  return textToRefactor
}
const forEachBARS = (textToRefactor, name, i) => {
  const BARSlbELSE = /\{\{\#else\}\}/
  const BARSlbIF   = /\{\{\#if/
  const BARSescIF  = /\{\{\/if\}\}/
  const BARSlb  = /\{\{\#/
  const BARSesc = /\{\{\//
  const startBARS  = /\{\{/
  const endBARS    = /\}\}/
  const period     = /\./
  let hideHTML     = ''
  let processText  = textToRefactor
  let currentPosition = 0
  while( currentPosition = startBARS.exec(processText) ){
    if( BARSlbIF.test( processText ) &&
        BARSlbIF.exec(processText ).index === currentPosition.index ) {
       hideHTML   += processText.slice(0, currentPosition.index+5)
       processText = processText.slice(currentPosition.index+5)
       runBank.push({ type: "each-skip-BARSlbIF", pos: currentPosition.index})
    }
    else if( BARSlbELSE.test( processText ) &&
        BARSlbELSE.exec(processText ).index === currentPosition.index ) {
       hideHTML   += processText.slice(0, currentPosition.index+9)
       processText = processText.slice(currentPosition.index+9)
       runBank.push({ type: "each-skip-BARSlbELSE", pos: currentPosition.index})
    }
    else if( BARSescIF.test( processText ) &&
        BARSescIF.exec(processText ).index === currentPosition.index ) {
       hideHTML   += processText.slice(0, currentPosition.index+7)
       processText = processText.slice(currentPosition.index+7)
       runBank.push({ type: "each-skip-BARSescIF", pos: currentPosition.index})
    }
    else {
      var start  = currentPosition.index
      var end    = endBARS.exec(processText.slice(start)).index + start
      let varKey = processText.slice(start+3, end-1)
      if( varKey == '@index') {
        var data = i
      }
      else if( varKey == 'this' ) {
        data = dataStore[name][i]
      }
      else if( varKey == '.' ) {
        data = dataStore[name][i]
      }
      else {
        const splitKey = varKey.split('.')
        let objVar = dataStore[name][i]
        for(let j = 0; j< splitKey.length; j++){
          if( objVar[splitKey[j]] !==  undefined ) {
             objVar=objVar[splitKey[j]]
          } else {
            console.log("each - DATA ERROR:", objVar, splitKey, splitKey[j])
            objVar = ''
          }
        }
        data = objVar
      } 
      var newHTML = processText.slice(0, start)
      newHTML += data
      newHTML += processText.slice(end+2)
      processText = newHTML
      runBank.push({ type: "each-varKey", objKey: name, varKey: varKey, value: data, newHTML: [newHTML] })
    }
  }
  return hideHTML+processText
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
        newText += forEachBARS(innerText, name, i)
      })
      newText += textToProcess.slice(endOfEach+9) 
    }
    else{ 
       newText = textToProcess.slice(0, startOfEach)
       newText += textToProcess.slice(endOfEach+9)
       console.log(false) 
    }
    return newText
  }
  return textToProcess 
}
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
    if( startBARS.test(conditionText) ) {
      conditionText += ' }}'
      innerText = innerText.slice(3)
      conditionText = replaceBARS(conditionText)
    }
    let newText  = textToProcess.slice(0, startOfIf)
    let ifText   = '' 
    let elseText = ''
    if( BARSlbELSE.exec(innerText) ) {
       const startOfElse = BARSlbELSE.exec(innerText).index
       ifText   = replaceBARS(innerText.slice(0, startOfElse))
       elseText = replaceBARS(innerText.slice(startOfElse+9))
    }
    if( eval(conditionText) ){  
      newText += ifText
      newText += textToProcess.slice(endOfIf+8)
    } 
    else{ 
      newText += elseText
      newText += textToProcess.slice(endOfIf+8) 
    } 
    runBank.push({ type: "if", t_f: conditionText, ifText: ifText, elseText: elseText})
    return newText 
  } 
  return textToProcess 
}
const replacePartial = (textToProcess) => {
  const startBARSarrow = /\{\{\>/
  const startBARS      = /\{\{/
  const endBARS        = /\}\}/
  const period         = /\./

  if( startBARSarrow.test(textToProcess) ){
    const start        = startBARSarrow.exec(textToProcess).index
    const end          = endBARS.exec(textToProcess.slice(start) ).index + start
    const partialName  = textToProcess.slice(start+3, end)

    if( dataStore.partials[partialName] !== undefined ) {
       var data = dataStore.partials[partialName]
    }else {
       data = ""
       runBank.push({type: "replacePartial", errror: "Partial Not Found:" + partialName })
    }
    let newHTML = textToProcess.slice(0, start)
    newHTML += data
    if( textToProcess.length >= (end+2) ) {
      newHTML += textToProcess.slice(end+2)
    }
    runBank.push({type: "replacePartial", data: data, newHTML: newHTML})
    return newHTML
  }
  runBank.push({type: "replacePartialSKIP", data: "THIS SHOULD NEVER HAPPEN"})
  return textToRefactor
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
      processedHTML = replaceBARSeach(processedHTML)
    }
  }
  return processedHTML
}
const processPartials = (html) => {
  const startPartial = /\{\{\>/
  let processedHTML = html
  if( startPartial.test(processedHTML) ){
    while(startPartial.test(processedHTML) ){
      processedHTML = replacePartial(processedHTML)
    }
  }
  return processedHTML
}
const compileHTML = (html) => {
   let processedHTML = processPartials(html)
   processedHTML     = processEACH(processedHTML)
   processedHTML     = processIF(processedHTML)
   processedHTML     = processBARS(processedHTML)
   return processedHTML //compileHTML(html)
}

const renderHTML = (html, myDiv = 'myDiv') => {
  document.getElementById(myDiv).innerHTML = html
  runBank.push({ type: "end of run"})
}
//KickStart
//Main
//const originalHTML = document.getElementById('myDiv')
                             //.innerHTML
                             //.replace( '&lt;', '<' )
                             //.replace( '&gt;', '>' )
//const originalHTML = new Runner().returnValue('HTML') 
//renderHTML(compileHTML(originalHTML))
console.log("FakeBARS-loaded:")
console.log("FakeBARS-dataBank:", dataStore)
console.log("FakeBARS-runBank:", runBank)