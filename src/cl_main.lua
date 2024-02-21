local gameStarted = false

local function repairGame(difficulty, text)
    if gameStarted then return end
    gameStarted = true

    SendNUIMessage({
        type = 'repairGame',
        difficulty = difficulty,
        text = text
    })

    SetNuiFocus(true, true)
    return percentage
end exports('repairGame', repairGame)

RegisterNUICallback('repairGameFinished', function(data, cb)
    if not gameStarted then print('nui devtools') return false end

    gameStarted = false
    percentage = data.percentage
    SetNuiFocus(false, false)
    cb()
end)
