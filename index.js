let deckId

const pileComputer = {
    name: "pileComputer",
    count: 0
}
const pilePlayer = {
    name: "pilePlayer",
    count: 0
}
const pileWar = {
    name: "pileWar",
    count: 0
}

const cards = document.getElementById("cards")
const header = document.getElementById("header")
const drawBtn = document.getElementById("draw-cards")


shuffle()

document.getElementById("new-deck").addEventListener("click", shuffle)


async function shuffle() {
    cards.innerHTML = `
        <div class="placeholder-card"></div>
        <div class="placeholder-card"></div>
    `
    header.innerText = "Game of War!"
    drawBtn.removeAttribute("disabled")
    
    
    
    
    const response = await fetch("https://deckofcardsapi.com/api/deck/new/shuffle/")
    const data = await response.json()
    deckId = data.deck_id
    
    pileCards(pileComputer)
    pileCards(pilePlayer)
    
    renderScore()
}


async function pileCards(pile){
    pile.count = 26
    
    const response = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=26`)
    const data = await response.json()
    
    await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/pile/${pile.name}/add/?cards=${data.cards.map(card => card.code)}`)
}


drawBtn.addEventListener("click", async () => {
    const {dataC, dataP} = await draw2Cards()
    
    renderCards([dataC.cards[0].image, dataP.cards[0].image])
    battle(dataC.cards[0], dataP.cards[0])
})


async function draw2Cards(){
    pileComputer.count -= 1
    pilePlayer.count -= 1
    
    const responseC = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/pile/${pileComputer.name}/draw/bottom/?count=1`)
    const dataC = await responseC.json()
    
    const responseP = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/pile/${pilePlayer.name}/draw/bottom/?count=1`)
    const dataP = await responseP.json()
    
    return {dataC, dataP}
}


async function battle(card1, card2){
    val1 = normalize(card1.value)
    val2 = normalize(card2.value)
    
    if(val1 > val2){
        battleWon(pileComputer, "Computer", card1, card2)
    }
    
    else if(val1 < val2){
        battleWon(pilePlayer, "Player", card1, card2)
    }
    
    else{
        if(!pileComputer.count || !pilePlayer.count){
            renderScore()
        }
        else{
            const {dataC, dataP} = await draw2Cards()
        
            await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/pile/${pileWar.name}/add/?cards=${dataC.cards[0].code},${dataP.cards[0].code},${card1.code},${card2.code}`)
            
            pileWar.count += 4
            header.innerText="War!"
            
            renderScore()
        }
    }
}


async function battleWon(pileWinner, winner, card1, card2){
    await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/pile/${pileWinner.name}/add/?cards=${card1.code},${card2.code}`)
        
    pileWinner.count += 2
    header.innerText=`${winner} won!`
        
    if(pileWar.count){
        warWon(pileWinner)
    }
    else{
        renderScore()
    }
}


async function warWon(pileWinner){
    const response = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/pile/${pileWar.name}/draw/bottom/?count=${pileWar.count}`)
    const data = await response.json()
    
    await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/pile/${pileWinner.name}/add/?cards=${data.cards.map(card => card.code)}`)
    
    pileWinner.count += pileWar.count
    pileWar.count = 0
    
    renderScore()
}


function renderCards(images){
    cards.innerHTML = images.map(image => `
        <img class="card-img" src=${image}>
    `).join("")
}


function renderScore(){
    document.getElementById("score-computer").innerText = `Computer: ${pileComputer.count}`
    document.getElementById("score-player").innerText = `Player: ${pilePlayer.count}`
    
               
    if(!pileComputer.count && !pilePlayer.count){
        endGame()
    }                                
    else if(!pileComputer.count){
        endGame("Player", "😎")
    }
    else if(!pilePlayer.count){
        endGame("Computer", "🤡")
    }
}


function endGame(winner, emoji){
    winner ? header.innerText = `${winner} has won the War! ${emoji}` :
             header.innerText = `It's a draw! 😱`
             
    drawBtn.setAttribute("disabled", true)
}


function normalize(value){
    switch (value){
        case "JACK":
            return 11
        case "QUEEN":
            return 12
        case "KING":
            return 13
        case "ACE":
            return 14
    }
    return parseInt(value)
}
