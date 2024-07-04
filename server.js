const WebSocket = require('ws');

const mysql = require('mysql2'); // mysql2 모듈을 추가로 require

const wss = new WebSocket.Server({ port: 4000 });

// MySQL 연결 설정
const connection = mysql.createConnection({
    host: 'spring-database.c7ms48g6s76s.ap-northeast-2.rds.amazonaws.com',
    user: 'chat1', // MySQL 사용자 이름
    password: '123456', // MySQL 비밀번호
    database: 'issue', // 사용할 데이터베이스 이름
});

// 연결
connection.connect((err) => {
    if (err) {
      console.error('MySQL 연결 오류:', err);
      return;
    }
    console.log('MySQL에 연결되었습니다.');
  });



// 클라이언트에게 초기 데이터 전송
wss.on('connection', ws => {
    console.log('Client connected');

    // 초기 데이터 가져오기
    getPopularSearchTerms((err, initialData) => {
        if (err) {
            console.error('Error fetching initial data:', err);
            return;
        }
        ws.send(JSON.stringify(initialData));
    });

    // 데이터가 변경될 때 클라이언트로 전송
    const interval = setInterval(() => {
        getPopularSearchTerms((err, updatedData) => {
            if (err) {
                console.error('Error fetching updated data:', err);
                return;
            }
            ws.send(JSON.stringify(updatedData));
        });
    }, 5000); // 5초마다 업데이트

    ws.on('close', () => {
        console.log('Client disconnected');
        clearInterval(interval);
    });
});

// 최신 인기 검색어 데이터 가져오기
function getPopularSearchTerms(callback) {
    connection.query('SELECT search_term FROM tbl_search_term GROUP BY search_term ORDER BY COUNT(*) DESC LIMIT 5', (err, results, fields) => {
        if (err) {
            callback(err, null);
            return;
        }
        const popularSearchTerms = results.map(row => row.search_term);
        callback(null, popularSearchTerms);
    });
}
