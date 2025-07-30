const express = require('express');
const si = require('systeminformation');
const { exec } = require('child_process');

const app = express();
const PORT = 2337;

async function getLmSensors() {
    return new Promise((resolve) => {
        exec('sensors', (error, stdout, stderr) => {
            console.log(error);
            console.log(stderr);
            console.log("stdout:" + stdout);
            if (error || stderr) {
                resolve(error + "\n " + stderr); // ما في حساسات أو خطأ بالتنفيذ
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

async function getSystemInfo() {
    try {
        const cpuTemp = await si.cpuTemperature();
        const cpuLoad = await si.currentLoad();
        const mem = await si.mem();
        const disks = await si.fsSize();

        const diskData = disks.map(disk => ({
            mount: disk.mount,
            totalGB: +(disk.size / 1e9).toFixed(2),
            usedGB: +(disk.used / 1e9).toFixed(2),
            freeGB: +(disk.available / 1e9).toFixed(2)
        }));

        const lmSensorsOutput = await getLmSensors();

        const res =  {
            cpuTemperature: cpuTemp.main ?? null,
            cpuLoadPercent: +cpuLoad.currentLoad.toFixed(2),
            ramTotalGB: +(mem.total / 1e9).toFixed(2),
            ramUsedGB: +(mem.active / 1e9).toFixed(2),
            disks: diskData,
            lmSensors: lmSensorsOutput // نص ناتج sensors أو null لو غير متوفر
        };

        consol.log(JSON.stringify(res));
        return res;
    } catch (err) {
        return { error: 'Failed to get system info', details: err.message };
    }
}

app.get('/status', async (req, res) => {
    const data = await getSystemInfo();
    res.json(data);
});

app.listen(PORT, () => {
    console.log(`✅ Agent running at http://localhost:${PORT}/status`);
});
