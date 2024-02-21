const resourceName = GetParentResourceName()
const difficulties = {
    'hard': {
        rounds: 5,
        speed: 30,
        bars: 2,
        loopTimes: 1,
    }, 

    'medium': {
        rounds: 3,
        speed: 42,
        bars: 3,
        loopTimes: 2,
    },

    'easy': {
        rounds: 2,
        speed: 45,
        bars: 6,
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

async function appendBars() {
    for (let i = 1; i <= 20; i++) {
        if ($('#' + i).length) $('#' + i).remove()

        var text = minigame.colors[i] && '+' || '-'
        var color = text == '+' && '#489c56' || '#1A1A1A'

        $('.minigame-bars').append(`<div id = ${i} class="bar" style="background-color: ${color}">${text}</div>`)
    }
}

async function randomizeColors() {
    var colorTable = {}
    for (let i = 1; i <= minigame.bars; i++) {
        var number = randomNumber(1, 20)
        while (colorTable[number]) {
            number = randomNumber(1, 20)
        }

        colorTable[number] = true
    }

    return colorTable
}

async function start() {
    $('.minigame-text').html(minigame.text)
    minigame.currentBar = 0
    minigame.lastBar = -1
    minigame.colors = await randomizeColors()
    await appendBars()

    setTimeout(function(){
        var currentRound = minigame.pastRounds
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

    var lastBar = minigame.lastBar
    var currentBar = minigame.currentBar
    var isBackwards = currentBar > 20 || !currentBar < 0
    if (minigame.loop) clearInterval(minigame.loop)

    var loop = setInterval(function() {
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
              
        var successPercentage = Math.floor(100 * (minigame.succeeded / minigame.rounds))
        minigame = {
            started: false,
            roundStarted: false,
            lastBar: -1,
            currentBar: 0,
            pastRounds: 0,
            loopedTimes: 0,
            succeeded: 0
        }

        $.post('https://'+resourceName+'/repairGameFinished', JSON.stringify({
            percentage: successPercentage
        }))
    }, 1000)
}

window.addEventListener('message', function (event) {
    var event = event.data;
    if (event.type == 'repairGame') {
        var difficulty = difficulties[event.difficulty || 'easy']
        var text = event.text || 'KORJATAAN'

        minigame.rounds = difficulty.rounds
        minigame.speed = difficulty.speed
        minigame.loopTimes = difficulty.loopTimes
        minigame.bars = difficulty.bars
        minigame.text = text

        $('.minigame-bg').css('display', 'flex').hide().fadeIn(200)
        $('.minigame').css('display', 'flex').hide().fadeIn(200)
        $('.minigame-bars').css('display', 'flex').hide().fadeIn(200)
        $('.minigame-text').html(minigame.text)

        start()
    }
})

document.addEventListener('keydown', function(ev) {
    var keyPressed = ev.key
    if (keyPressed == ' ') {
        if (!minigame.roundStarted) return
        minigame.roundStarted = false
        minigame.loopedTimes = 0
        
        clearInterval(minigame.loop)

        var currentBar = minigame.currentBar
        var success = minigame.colors[currentBar]
        if (success) minigame.succeeded++
        
        $('.minigame-text').html(success && 'ONNISTUIT!' || 'EPÄONNISTUIT')

        minigame.pastRounds++
        if (minigame.rounds > minigame.pastRounds) return setTimeout(start, 500)

        return setTimeout(finished, 500)
    }
})
