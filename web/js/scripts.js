const RESOURCE_NAME = GetParentResourceName()
const TOTAL_BARS = 20
const DIFFICULTIES = {
    'hard': {
        rounds: 7,
        speed: 30,
        correctBars: 2,
        loopTimes: 1,
    }, 

    'medium': {
        rounds: 6,
        speed: 42,
        correctBars: 3,
        loopTimes: 2,
    },

    'easy': {
        rounds: 3,
        speed: 45,
        correctBars: 6,
        loopTimes: 3,
    }
}

var minigame = {
    started: false,
    roundStarted: false,
    lastBar: -1,
    currentBar: 0,
    pastRounds: 0,
    loopedTimes: 0,
    succeeded: 0
}

async function appendBars(totalBars, colors) {
    for (let i = 1; i <= totalBars; i++) {
        if ($('#' + i).length) $('#' + i).remove()

        let minigameText = colors[i] && '+' || '-'
        let barColor = minigameText == '+' && '#489c56' || '#1A1A1A'

        $('.minigame-bars').append(`<div id = ${i} class="bar" style="background-color: ${barColor}">${minigameText}</div>`)
    }
}

async function randomizeColors(totalBars, correctBars) {
    if (correctBars >= totalBars) {
        throw new Error("There must be less or as many correct bars as there are bars in total")
    }

    let colorTable = new Array(totalBars).fill(false);
    let shuffleArray = Array.from({ length: totalBars}, (_, i) => i);
    
    for (let i = totalBars - 1; i > 0; i--) {
        let rand = Math.floor(Math.random() * (i + 1));
        [shuffleArray[i], shuffleArray[rand]] = [shuffleArray[rand], shuffleArray[i]]
    }
    
    for (let i = 0; i < correctBars; i++) {
        colorTable[shuffleArray[i]] = true;
    }

    return colorTable
}

async function start() {
    let totalBars = TOTAL_BARS
    let correctBars = minigame.correctBars
    
    let colors = await randomizeColors(totalBars, correctBars)
    await appendBars(totalBars, colors)

    $('.minigame-text').html(minigame.text)
    minigame.colors = colors
    minigame.currentBar = 0
    minigame.lastBar = -1

    setTimeout(function(){
        minigame.roundStarted = true

        return barLoop()
    }, 500)
}

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min) + min)
}

function barLoop() {
    minigame.loopedTimes++
    if (minigame.loopedTimes > minigame.loopTimes) {
        minigame.loopedTimes = 0
        minigame.roundStarted = false

        clearInterval(minigame.loop)
        $('.minigame-text').html('EPÄONNISTUIT')

        minigame.pastRounds++
        if (minigame.rounds > minigame.pastRounds) return setTimeout(start, 500)

        return setTimeout(finished, 500)
    }

    let lastBar = minigame.lastBar
    let currentBar = minigame.currentBar
    let isBackwards = currentBar > 20 || !currentBar < 0
    if (minigame.loop) clearInterval(minigame.loop)

    let loop = setInterval(function() {
        currentBar = isBackwards && currentBar -1 || !isBackwards && currentBar +1
        $('#' + lastBar).css('border', 'none')
        $('#' + lastBar).css('opacity', '1.0')
        $('#' + currentBar).css('border', '1px solid #959599')
        $('#' + currentBar).css('opacity', '0.3')

        minigame.lastBar, lastBar = currentBar
        minigame.currentBar = currentBar
        if (currentBar > 20 || currentBar < 0) barLoop()
    }, minigame.speed)

    minigame.loop = loop
}

function finished() {
    $('.minigame-bars').fadeOut(1000)
    $('.minigame').fadeOut(1000)

    setTimeout(function(){
        $('.minigame-bg').fadeOut()
              
        let successPercentage = Math.floor(100 * (minigame.succeeded / minigame.rounds))
        minigame = {
            started: false,
            roundStarted: false,
            lastBar: -1,
            currentBar: 0,
            pastRounds: 0,
            loopedTimes: 0,
            succeeded: 0
        }

        $.post('https://'+RESOURCE_NAME+'/repairGameFinished', JSON.stringify({
            percentage: successPercentage
        }))
    }, 1000)
}

window.addEventListener('message', function (ev) {
    let event = ev.data;
    if (event.type != 'repairGame' || minigame.started) return

    let difficulty = DIFFICULTIES[event.difficulty || 'easy']
    let minigameText = event.text || 'KORJATAAN'

    minigame.started = true
    minigame.rounds = difficulty.rounds
    minigame.speed = difficulty.speed
    minigame.loopTimes = difficulty.loopTimes
    minigame.correctBars = difficulty.correctBars
    minigame.text = minigameText

    $('.minigame-bg').css('display', 'flex').hide().fadeIn(200)
    $('.minigame').css('display', 'flex').hide().fadeIn(200)
    $('.minigame-bars').css('display', 'flex').hide().fadeIn(200)
    $('.minigame-text').html(minigameText)

    return start()
})

document.addEventListener('keydown', function(ev) {
    let keyPressed = ev.key
    if (keyPressed != ' ' || !minigame.roundStarted) return

    minigame.roundStarted = false
    minigame.loopedTimes = 0
    
    clearInterval(minigame.loop)

    let currentBar = minigame.currentBar
    let success = minigame.colors[currentBar]
    if (success) minigame.succeeded++
    
    $('.minigame-text').html(success && 'ONNISTUIT!' || 'EPÄONNISTUIT')

    minigame.pastRounds++
    if (minigame.rounds > minigame.pastRounds) return setTimeout(start, 500)

    return setTimeout(finished, 500)
})
