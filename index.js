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
const shuffleBtn = document.getElementById("new-deck")


shuffle()

shuffleBtn.addEventListener("click", shuffle)


async function shuffle() {
    cards.innerHTML = `
        <div class="placeholder-card"></div>
        <div class="placeholder-card"></div>
    `
    header.innerText = "Game of War!"
    drawBtn.removeAttribute("disabled")
    
    
    
    try{
        shuffleBtn.textContent = "Shuffling deck..."
        drawBtn.disabled = true

        const response = await fetch("https://deckofcardsapi.com/api/deck/new/shuffle/")
        if(!response.ok){
            throw Error(response.status)
        }

        const data = await response.json()
        deckId = data.deck_id
        
        await pileCards(pileComputer)
        await pileCards(pilePlayer)
        
        renderScore()
        shuffleBtn.textContent = "Shuffle deck"
        drawBtn.disabled = false
    }
    catch(e){
        console.error(e)
        shuffleBtn.textContent = "Unable to shuffle the deck, please try again"
    }
}


async function pileCards(pile){
    pile.count = 26
    
    const response = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=26`)
    if(!response.ok){
        throw Error(response.status)
    }
    const data = await response.json()
    
    const response2 = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/pile/${pile.name}/add/?cards=${data.cards.map(card => card.code)}`)
    if(!response2.ok){
        throw Error(response2.status)
    }

    return true
}


drawBtn.addEventListener("click", async () => {
    drawBtn.disabled = true
    drawBtn.textContent = "Drawing..."

    try{
        const {dataC, dataP} = await draw2Cards()
    
        renderCards([dataC.cards[0].image, dataP.cards[0].image])
        await battle(dataC.cards[0], dataP.cards[0]) // aaa

        drawBtn.textContent = "Draw"
    }
    catch(e){
        console.error(e)
        drawBtn.textContent = "Something went wrong, please draw again"
    }
    finally{
        drawBtn.disabled = false
    }
    
})


async function draw2Cards(){
    pileComputer.count -= 1
    pilePlayer.count -= 1
    
    const responseC = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/pile/${pileComputer.name}/draw/bottom/?count=1`)
    if(!responseC.ok){
        throw Error(responseC.status)
    }
    const dataC = await responseC.json()
    
    const responseP = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/pile/${pilePlayer.name}/draw/bottom/?count=1`)
    if(!responseP.ok){
        throw Error(responseP.status)
    }
    const dataP = await responseP.json()
    
    return {dataC, dataP}
}


async function battle(card1, card2){
    val1 = normalize(card1.value)
    val2 = normalize(card2.value)

    if(val1 > val2){
        try{
            await battleWon(pileComputer, "Computer", card1, card2) // aaa
        }
        catch(e){
            throw e
        }
        
    }
    
    else if(val1 < val2){
        try{
            await battleWon(pilePlayer, "Player", card1, card2) // aaa
        }
        catch(e){
            throw e
        }
        
    }
    
    else{
        if(!pileComputer.count || !pilePlayer.count){
            renderScore()
        }
        else{
            const {dataC, dataP} = await draw2Cards()
        
            const res = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/pile/${pileWar.name}/add/?cards=${dataC.cards[0].code},${dataP.cards[0].code},${card1.code},${card2.code}`)
            if(!res.ok){
                throw Error(res.status)
            }

            pileWar.count += 4
            header.innerText="War!"
            
            renderScore()
        }
    }
}


async function battleWon(pileWinner, winner, card1, card2){
    const res = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/pile/${pileWinner.name}/add/?cards=${card1.code},${card2.code}`)
    if(!res.ok){
        throw Error(res.status)
    }
        
    pileWinner.count += 2
    header.innerText=`${winner} won!`
        
    if(pileWar.count){
        try{
            await warWon(pileWinner) // aaa
        }
        catch(e){
            throw e
        }
    }
    else{
        renderScore()
    }
}


async function warWon(pileWinner){
    const response1 = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/pile/${pileWar.name}/draw/bottom/?count=${pileWar.count}`)
    if(!response1.ok){
        throw Error(response1.status)
    }
    const data = await response1.json()
    
    const response2 = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/pile/${pileWinner.name}/add/?cards=${data.cards.map(card => card.code)}`)
    if(!response2.ok){
        throw Error(response2.status)
    }
    
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
