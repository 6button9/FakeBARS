//let dataStore = []
const BARSarrow    = /\{\{\>/
const BARSlbEACH   = /\{\{\#each/ 
const BARSescEACH  = /\{\{\/each\}\}/ 
const BARSlbELSE   = /\{\{\#else\}\}/
const BARSlbIF     = /\{\{\#if/
const BARSescIF    = /\{\{\/if\}\}/
const BARSlb       = /\{\{\#/
const BARSesc      = /\{\{\//
const startBARS    = /\{\{/
const endBARS      = /\}\}/
const period       = /\./

class FakeBARS {
  constructor(html, context = null, partials = null) {
    this.partials = partials
    this.context  = context
    this.html     = html
    this.runBank  = [{}]
    console.log(context)
  }
getRunBank() {
		return this.runBank
}
replaceBARS (textToProcess) {
  if( startBARS.test(textToProcess) ){
    const start = startBARS.exec(textToProcess).index
    const end   = endBARS.exec(textToProcess.slice(start) ).index + start
    let varKey  = textToProcess.slice(start+2, end)
		if( varKey.includes(' ') ) {
				const functionParts = varKey.split(' ')
				varKey = functionParts[0]
				var functionArgs = functionParts.slice(1)
				console.log("function-args", varKey, functionArgs)
				functionArgs = functionArgs.map( (ar) =>
																			   this.context[ar]
																			 )
		}
    const splitKey = varKey.split('.')
    let objVar = this.context
    for(let i = 0; i< splitKey.length; i++){
      if( objVar[splitKey[i]] !== undefined ) {
         objVar=objVar[splitKey[i]]
      } else {
        console.log("DATA ERROR:", splitKey, splitKey[i])
        objVar = varKey
      }
    }
    let newHTML = textToProcess.slice(0, start)
    if( typeof objVar === 'function' ) {
      newHTML += objVar(...functionArgs)
    } else {
      newHTML += objVar
    }
    if( textToProcess.length >= (end+2) ) {
      newHTML += textToProcess.slice(end+2)
    }
    this.runBank.push({type: "replaceBARS", varKey: varKey, value: objVar, newHTML: [newHTML]})
    return newHTML
  }
  return textToProcess
}
forEachBARS (textToProcess, name, i ) {

  let hideHTML     = ''
  let processText  = textToProcess
  let currentPosition = 0
  let count = 0
  //console.log("forEachBARS", textToProcess)
  while( currentPosition = startBARS.exec(processText) ){
    if( BARSlbIF.test( processText ) &&
        BARSlbIF.exec(processText ).index === currentPosition.index ) {
       hideHTML   += processText.slice(0, currentPosition.index+5)
       processText = processText.slice(currentPosition.index+5)
       this.runBank.push({ type: "each-skip-BARSlbIF", pos: currentPosition.index})
    }
    else if( BARSlbELSE.test( processText ) &&
       BARSlbELSE.exec(processText ).index === currentPosition.index ) {
       hideHTML   += processText.slice(0, currentPosition.index+9)
       processText = processText.slice(currentPosition.index+9)
       this.runBank.push({ type: "each-skip-BARSlbELSE", pos: currentPosition.index})
    }
    else if( BARSescIF.test( processText ) &&
       BARSescIF.exec(processText ).index === currentPosition.index ) {
       hideHTML   += processText.slice(0, currentPosition.index+7)
       processText = processText.slice(currentPosition.index+7)
       this.runBank.push({ type: "each-skip-BARSescIF", pos: currentPosition.index})
    }
    else {
      var start  = currentPosition.index
      var end    = endBARS.exec(processText.slice(start)).index + start
      let varKey = processText.slice(start+2, end)
			if( /^..\//.exec(varKey) ){
				 varKey = '*'+ varKey.slice(3)
      }
      if( varKey == '@index') {
        var data = i
      }
      else if( varKey == 'this' ) {
        data = this.context[name][i]
      }
      else if( varKey == '.' ) {
        data = this.context[name][i]
      }
      else {
        const splitKey = varKey.split('.')
        const splitObj = name.split('.')
        let objVar = this.context
        for(let j =0; j < splitObj.length; j++) {
          objVar = objVar[splitObj[j]]
        }
        objVar = objVar[i]
        if( varKey[0][0] === '*' ) {
          splitKey[0] = splitKey[0].slice(1)
          objVar = this.context
        }
        for(let j = 0; j< splitKey.length; j++){
          if( objVar[splitKey[j]] !==  undefined ) {
             objVar=objVar[splitKey[j]]
          } else {
            console.log("each - DATA ERROR:", objVar, splitKey, splitKey[j])
            objVar = name
          }
        }
        data = objVar
      } 
      var newHTML = processText.slice(0, start)
      newHTML += data
      newHTML += processText.slice(end+2)
      processText = newHTML
      this.runBank.push({ type: "each-varKey", objKey: name, varKey: varKey, value: data, newHTML: [newHTML] })
      if( count++ > 1000 ) break
    }
  }
  return hideHTML+processText
}
replaceBARSeach (textToProcess) {
  if( BARSlbEACH.test(textToProcess) ) { 
    const startOfEach      = BARSlbEACH.exec(textToProcess).index 
    const endBARSafterEach = endBARS.exec(textToProcess.slice(startOfEach)).index+startOfEach
    const endOfEach        = BARSescEACH.exec(textToProcess).index 
    const name             = textToProcess.slice(startOfEach + 8 , endBARSafterEach) 
    const innerText        = textToProcess.slice(endBARSafterEach+2, endOfEach)
    if( this.context[name] !== null ){ 
      var newText = textToProcess.slice(0, startOfEach, name) 
      let myContext = this.context
      const splitObj = name.split('.')
      console.log("splitObj",splitObj)
      for(let j =0; j < splitObj.length; j++) {
        myContext = myContext[splitObj[j]]
      }
      myContext.forEach( (v, i) => {
      //for(let i = 0; i < dataStore[name].length; i++ ){
          console.log("forEachLoop", i)
        newText += this.forEachBARS(innerText, name, i)
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
replaceBARSif (textToProcess) {
  if( BARSlbIF.test(textToProcess) ) { 
    const startOfIf      = BARSlbIF.exec(textToProcess).index 
    const endBARSafterIf = endBARS.exec(textToProcess.slice(startOfIf)).index+startOfIf 
    const endOfIf        = BARSescIF.exec(textToProcess).index 
    let conditionText    = textToProcess.slice(startOfIf + 6, endBARSafterIf) 
    let innerText        = textToProcess.slice(endBARSafterIf+2, endOfIf)
    if( startBARS.test(conditionText) ) {
      conditionText += ' }}'
      innerText = innerText.slice(3)
      conditionText = this.replaceBARS(conditionText)
    }
    let newText  = textToProcess.slice(0, startOfIf)
    let ifText   = innerText 
    let elseText = ''
    if( BARSlbELSE.test(innerText) ) {
       const startOfElse = BARSlbELSE.exec(innerText).index
       ifText   = innerText.slice(0, startOfElse)
       elseText = innerText.slice(startOfElse+9)
    }
    if( eval(conditionText) ){  
      newText += ifText
      newText += textToProcess.slice(endOfIf+7)
    } 
    else{ 
      newText += elseText
      newText += textToProcess.slice(endOfIf+7) 
    } 
    this.runBank.push({ type: "if", t_f: conditionText, ifText: ifText, elseText: elseText})
    return newText 
  } 
  return textToProcess 
}
replacePartial (textToProcess) {
  if( BARSarrow.test(textToProcess) ){
    const start      = BARSarrow.exec(textToProcess).index
    const end        = endBARS.exec(textToProcess.slice(start) ).index + start
    let partialName  = textToProcess.slice(start+3, end)
    if( partialName.includes(' ') ) {
        console.log(partialName.split(' '))
        const partialContext = partialName.split(' ')[1]
        partialName = partialName.split(' ')[0]
        var data = this.compileHTMLContext( this.partials[partialName], this.context[partialContext]) 
    } else if( this.partials[partialName] !== undefined ) {
       data = this.partials[partialName]
    } else if( this.this.context.partials[partialName] !== undefined ) {
       data = this.context.partials[partialName]
    } else {
       data = ""
       this.runBank.push({type: "replacePartial", errror: "Partial Not Found:" + partialName })
    }
    let newHTML = textToProcess.slice(0, start)
    newHTML += data
    if( textToProcess.length >= (end+2) ) {
      newHTML += textToProcess.slice(end+2)
    }
    this.runBank.push({type: "replacePartial", partial: partialName, data: data, newHTML: newHTML})
    return newHTML
  }
  this.runBank.push({type: "replacePartialSKIP", partiona: partialName, data: "THIS SHOULD NEVER HAPPEN"})
  return textToProcess
}
processBARS (html) {
  let processedHTML = html
  if( startBARS.test(processedHTML) ){
    while(startBARS.test(processedHTML) ){
      processedHTML = this.replaceBARS(processedHTML)
    }
  }
  return processedHTML
}

processIF (html) {
  let processedHTML = html
  if( BARSlbIF.test(processedHTML) ){
    while(BARSlbIF.test(processedHTML) ){
      processedHTML = this.replaceBARSif(processedHTML)
    }
  }
  return processedHTML
}

processEACH (html) {
  let processedHTML = html
  if( BARSlbEACH.test(processedHTML) ){
    while(BARSlbEACH.test(processedHTML) ){
      processedHTML = this.replaceBARSeach(processedHTML)
    }
  }
  return processedHTML
}
processPartials (html) {
  let processedHTML = html
  if( BARSarrow.test(processedHTML) ){
    while(BARSarrow.test(processedHTML) ){
      processedHTML = this.replacePartial(processedHTML)
    }
  }
  //console.log("partials",processedHTML)
  return processedHTML
}
compileHTML (html = this.html) {
	 const startTime = Date.now()
   this.html = html
   let processedHTML = this.processPartials(html)
   processedHTML     = this.processEACH(processedHTML)
   processedHTML     = this.processIF(processedHTML)
   processedHTML     = this.processBARS(processedHTML)
   this.runBank.push({ type: "end of compile"})
	 console.log("compileHTML-ms:", Date.now() - startTime)
   return processedHTML //compileHTML(html)
}
compileHTMLContext (html, context) {
	 const startTime = Date.now()
   const tempContext = this.context
   this.context = context
   let processedHTML = this.processPartials(html)
   processedHTML     = this.processEACH(processedHTML)
   processedHTML     = this.processIF(processedHTML)
   processedHTML     = this.processBARS(processedHTML)
   this.context = tempContext
   this.runBank.push({ type: "end of compileHTMLcontext"})
		console.log("compileHTMLContext-ms:", Date.now() - startTime)
   return processedHTML //compileHTML(html)
}
compileContext (context) {
   //this.context[varKey] = objList
		const startTime = Date.now()
   this.context = context
   let processedHTML = this.processPartials(this.html)
   processedHTML     = this.processEACH(processedHTML)
   processedHTML     = this.processIF(processedHTML)
   processedHTML     = this.processBARS(processedHTML)
   this.runBank.push({ type: "end of compile"})
   console.log("compileContext-ms:", Date.now() - startTime)
   return processedHTML //compileHTML(html)
}
renderHTML (html, myDiv = 'myDiv') {
  document.getElementById(myDiv).innerHTML = html
  this.runBank.push({ type: "end of run"})
}
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
//console.log("FakeBARS-dataBank:", dataStore)
//console.log("FakeBARS-runBank:", runBank)
