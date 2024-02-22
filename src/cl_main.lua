local gameStarted = false

local function repairGame(difficulty, text)
    if gameStarted then return end
    gameStarted = true

    SendNUIMessage({
        type = 'repairGame',
        difficulty = difficulty,
        text = text
    })

    repeat Wait(100) until percentage and not gameStarted
    percentage = nil

    SetNuiFocus(true, true)
    return percentage
end exports('repairGame', repairGame)

RegisterCommand('minigame', function()
    repairGame('easy', 'HOMO')
end)

RegisterNUICallback('repairGameFinished', function(data, cb)
    if not gameStarted then print('nui devtools') return false end

    gameStarted = false
    percentage = data.percentage
    SetNuiFocus(false, false)
    cb()
end)
