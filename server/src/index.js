import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        message: 'BetTracker API funcionando',
    });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API ejecutándose en http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map