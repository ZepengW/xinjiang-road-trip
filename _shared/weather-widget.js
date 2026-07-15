/**
 * 实时天气预报组件 (Open-Meteo API)
 * 免费无需注册 · CORS支持 · 内置中国气象局CMA模型
 * 使用方法：在页面中放置一个 id="live-weather-widget" 的容器，然后引入此脚本
 */
(function() {
  'use strict';

  // 四个关键地点
  var LOCATIONS = [
    { name: '乌鲁木齐', label: 'D1/D6 乌市', lat: 43.82, lon: 87.62, role: '起止城市' },
    { name: '博乐', label: 'D2 赛湖', lat: 44.85, lon: 82.07, role: '赛里木湖最近城市' },
    { name: '伊宁', label: 'D3/D4 伊宁', lat: 43.91, lon: 81.32, role: '伊犁河谷' },
    { name: '独山子', label: 'D5 独库', lat: 44.33, lon: 84.88, role: '独库北入口' }
  ];

  // 行程日期
  var TRIP_DATES = ['2026-08-02','2026-08-03','2026-08-04','2026-08-05','2026-08-06','2026-08-07'];
  var TRIP_DAY_MAP = {
    '2026-08-02': 'D1', '2026-08-03': 'D2', '2026-08-04': 'D3',
    '2026-08-05': 'D4', '2026-08-06': 'D5', '2026-08-07': 'D6'
  };

  // WMO天气代码映射
  var WMO_CODES = {
    0:  { label: '晴', emoji: '☀', type: 'good' },
    1:  { label: '主要晴', emoji: '🌤', type: 'good' },
    2:  { label: '部分多云', emoji: '⛅', type: 'good' },
    3:  { label: '多云', emoji: '☁', type: 'neutral' },
    45: { label: '雾', emoji: '🌫', type: 'warn' },
    48: { label: '雾凇', emoji: '🌫', type: 'warn' },
    51: { label: '毛毛雨', emoji: '🌦', type: 'warn' },
    53: { label: '毛毛雨', emoji: '🌦', type: 'warn' },
    55: { label: '毛毛雨', emoji: '🌦', type: 'warn' },
    56: { label: '冻毛毛雨', emoji: '🌧', type: 'bad' },
    57: { label: '冻毛毛雨', emoji: '🌧', type: 'bad' },
    61: { label: '小雨', emoji: '🌧', type: 'warn' },
    63: { label: '中雨', emoji: '🌧', type: 'bad' },
    65: { label: '大雨', emoji: '🌧', type: 'bad' },
    66: { label: '冻雨', emoji: '🌧', type: 'bad' },
    67: { label: '冻雨', emoji: '🌧', type: 'bad' },
    71: { label: '小雪', emoji: '🌨', type: 'warn' },
    73: { label: '中雪', emoji: '🌨', type: 'bad' },
    75: { label: '大雪', emoji: '❄', type: 'bad' },
    77: { label: '雪粒', emoji: '🌨', type: 'warn' },
    80: { label: '阵雨', emoji: '🌦', type: 'warn' },
    81: { label: '阵雨', emoji: '🌧', type: 'warn' },
    82: { label: '强阵雨', emoji: '⛈', type: 'bad' },
    85: { label: '阵雪', emoji: '🌨', type: 'warn' },
    86: { label: '强阵雪', emoji: '❄', type: 'bad' },
    95: { label: '雷暴', emoji: '⛈', type: 'bad' },
    96: { label: '雷暴+冰雹', emoji: '⛈', type: 'bad' },
    99: { label: '强雷暴+冰雹', emoji: '⛈', type: 'bad' }
  };

  function getTypeColor(type) {
    switch(type) {
      case 'good': return '#2E7D32';
      case 'neutral': return '#1565C0';
      case 'warn': return '#D4A017';
      case 'bad': return '#C62828';
      default: return '#666';
    }
  }

  function getTypeBg(type) {
    switch(type) {
      case 'good': return 'rgba(46,125,50,0.08)';
      case 'neutral': return 'rgba(21,101,192,0.06)';
      case 'warn': return 'rgba(212,160,23,0.08)';
      case 'bad': return 'rgba(198,40,40,0.08)';
      default: return 'transparent';
    }
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr);
    var month = d.getMonth() + 1;
    var day = d.getDate();
    var weekDay = ['日','一','二','三','四','五','六'][d.getDay()];
    return month + '/' + day + '(' + weekDay + ')';
  }

  function isTripDate(dateStr) {
    return TRIP_DATES.indexOf(dateStr) !== -1;
  }

  function fetchWeather(location) {
    var url = 'https://api.open-meteo.com/v1/forecast' +
      '?latitude=' + location.lat +
      '&longitude=' + location.lon +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max' +
      '&timezone=Asia/Shanghai' +
      '&forecast_days=7';
    return fetch(url).then(function(resp) {
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      return resp.json();
    });
  }

  function renderWeather(results) {
    var html = '';
    var now = new Date();
    var timeStr = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0');

    html += '<div style="font-size:0.72rem; color:#8B7355; margin-bottom:0.6rem; font-family:\'Mono\',monospace;">数据更新时间：' + timeStr + ' · 数据源：Open-Meteo（CMA模型）</div>';
    html += '<div style="overflow-x:auto; border-radius:6px; border:1px solid #D4C4A8;">';
    html += '<table style="width:100%; border-collapse:collapse; font-size:0.78rem; background:white; min-width:600px;">';

    var firstResult = results[0];
    var dates = firstResult.data.daily.time;
    html += '<thead><tr style="background:#4A7A9B; color:white;">';
    html += '<th style="padding:0.5rem; text-align:left; font-family:\'NationalPark\',sans-serif; font-size:0.75rem; white-space:nowrap;">城市 / 日期</th>';
    for (var i = 0; i < dates.length; i++) {
      var isTrip = isTripDate(dates[i]);
      var tripDay = TRIP_DAY_MAP[dates[i]] || '';
      var cellStyle = isTrip ? 'background:#2E7D32;' : '';
      html += '<th style="padding:0.4rem; text-align:center; font-family:\'NationalPark\',sans-serif; font-size:0.72rem;' + cellStyle + '">';
      html += formatDate(dates[i]);
      if (isTrip) html += '<br><span style="font-size:0.62rem; opacity:0.9;">' + tripDay + ' 行程日</span>';
      html += '</th>';
    }
    html += '</tr></thead><tbody>';

    for (var j = 0; j < results.length; j++) {
      var loc = results[j].location;
      var daily = results[j].data.daily;
      var rowBg = j % 2 === 0 ? 'rgba(243,232,212,0.3)' : 'white';
      html += '<tr style="background:' + rowBg + ';">';
      html += '<td style="padding:0.5rem; border-bottom:1px solid #D4C4A8; vertical-align:top;">';
      html += '<div style="font-family:\'NationalPark\',sans-serif; font-size:0.85rem; color:#B8860B;">' + loc.name + '</div>';
      html += '<div style="font-size:0.68rem; color:#8B7355;">' + loc.label + '</div>';
      html += '<div style="font-size:0.62rem; color:#8B7355;">' + loc.role + '</div>';
      html += '</td>';

      for (var k = 0; k < daily.time.length; k++) {
        var wmo = daily.weather_code[k];
        var wmoInfo = WMO_CODES[wmo] || { label: '未知', emoji: '❓', type: 'neutral' };
        var maxT = Math.round(daily.temperature_2m_max[k]);
        var minT = Math.round(daily.temperature_2m_min[k]);
        var precipProb = daily.precipitation_probability_max ? daily.precipitation_probability_max[k] : null;
        var wind = daily.wind_speed_10m_max[k];
        var isTripCell = isTripDate(daily.time[k]);
        var cellBg = isTripCell ? getTypeBg(wmoInfo.type) : '';
        var borderColor = isTripCell ? 'border-left:2px solid ' + getTypeColor(wmoInfo.type) + ';' : '';

        html += '<td style="padding:0.4rem; text-align:center; border-bottom:1px solid #D4C4A8; border-left:1px solid #E8DDC8; vertical-align:top;' + cellBg + borderColor + '">';
        html += '<div style="font-size:1.1rem; line-height:1.2;">' + wmoInfo.emoji + '</div>';
        html += '<div style="font-size:0.68rem; color:' + getTypeColor(wmoInfo.type) + '; font-weight:bold; margin-top:1px;">' + wmoInfo.label + '</div>';
        html += '<div style="font-family:\'Mono\',monospace; font-size:0.72rem; margin-top:2px;">';
        html += '<span style="color:#C65D3A;">' + maxT + '°</span>/<span style="color:#4A7A9B;">' + minT + '°</span>';
        html += '</div>';
        if (precipProb !== null && precipProb !== undefined && precipProb > 0) {
          html += '<div style="font-size:0.6rem; color:#4A7A9B; margin-top:1px;">💧' + precipProb + '%</div>';
        }
        if (wind > 30) {
          html += '<div style="font-size:0.6rem; color:#D4A017; margin-top:1px;">💨' + Math.round(wind) + 'km/h</div>';
        }
        html += '</td>';
      }
      html += '</tr>';
    }

    html += '</tbody></table></div>';

    // 图例
    html += '<div style="display:flex; gap:0.8rem; margin-top:0.6rem; flex-wrap:wrap; font-size:0.7rem;">';
    html += '<span><span style="color:#2E7D32;">●</span> 晴好</span>';
    html += '<span><span style="color:#1565C0;">●</span> 多云</span>';
    html += '<span><span style="color:#D4A017;">●</span> 雾/小雨</span>';
    html += '<span><span style="color:#C62828;">●</span> 中大雨/雷暴</span>';
    html += '<span style="margin-left:auto; color:#8B7355;">高亮列 = 行程日期</span>';
    html += '</div>';

    // 行程日期匹配检测
    var tripFound = false;
    for (var t = 0; t < TRIP_DATES.length; t++) {
      if (dates.indexOf(TRIP_DATES[t]) !== -1) { tripFound = true; break; }
    }

    if (tripFound) {
      html += '<div style="margin-top:0.6rem; padding:0.5rem 0.8rem; background:#E8F5E9; border-radius:6px; font-size:0.78rem; color:#2E7D32;">';
      html += '✅ <strong>行程日期已进入7天预报窗口！</strong>上方高亮列为8/2-8/7的实时天气预报，请重点关注。';
      html += '</div>';
    } else {
      var daysUntilTrip = Math.ceil((new Date(TRIP_DATES[0]) - new Date()) / (1000 * 60 * 60 * 24));
      html += '<div style="margin-top:0.6rem; padding:0.5rem 0.8rem; background:#FFF9E8; border-radius:6px; font-size:0.78rem; color:#D4A017;">';
      html += '📅 距行程第一天（8/2）还有约 <strong>' + daysUntilTrip + ' 天</strong>。7天预报窗口将在约7/26起覆盖行程日期，届时此处将显示实时预报。';
      html += '</div>';
    }

    return html;
  }

  function init() {
    var containers = document.querySelectorAll('[data-weather-widget]');
    if (containers.length === 0) return;

    containers.forEach(function(container) {
      container.innerHTML =
        '<div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.6rem;">' +
          '<div style="display:flex; align-items:center; gap:0.5rem;">' +
            '<span style="background:#2E7D32; color:white; font-size:0.7rem; padding:0.15rem 0.6rem; border-radius:10px; font-family:\'Mono\',monospace;">LIVE · 实时</span>' +
            '<strong style="color:#2E7D32; font-size:1rem;">实时天气预报 · 7天逐日预报</strong>' +
          '</div>' +
          '<button class="weather-refresh" style="font-family:\'NationalPark\',sans-serif; font-size:0.78rem; padding:0.25rem 0.8rem; border:1.5px solid #2E7D32; border-radius:14px; background:white; color:#2E7D32; cursor:pointer;">刷新数据</button>' +
        '</div>' +
        '<div class="weather-loading" style="text-align:center; padding:2rem 0; color:#8B7355;">' +
          '<div style="font-size:1.5rem; margin-bottom:0.3rem;">⏳</div>' +
          '<div style="font-family:\'Mono\',monospace; font-size:0.82rem;">正在从 Open-Meteo 获取最新气象数据...</div>' +
        '</div>' +
        '<div class="weather-content" style="display:none;"></div>' +
        '<div class="weather-error" style="display:none; text-align:center; padding:1.5rem 0; color:#C65D3A;">' +
          '<div style="font-size:1.3rem; margin-bottom:0.3rem;">⚠</div>' +
          '<div style="font-size:0.85rem;">实时数据加载失败，请稍后刷新或查看页面静态预报数据</div>' +
        '</div>' +
        '<div style="margin-top:0.5rem; font-size:0.72rem; color:#8B7355; line-height:1.5;">' +
          '数据来源：Open-Meteo（内置中国气象局CMA模型）· 免费无需注册 · 每次打开页面自动获取最新预报<br>' +
          '<strong>注意：</strong>7天预报仅覆盖未来7天。行程日期（8/2-8/7）进入7天窗口后（约7/26起），此处将显示行程当天实时预报。' +
        '</div>';

      var loadingEl = container.querySelector('.weather-loading');
      var contentEl = container.querySelector('.weather-content');
      var errorEl = container.querySelector('.weather-error');
      var refreshBtn = container.querySelector('.weather-refresh');

      function loadWeather() {
        loadingEl.style.display = 'block';
        contentEl.style.display = 'none';
        errorEl.style.display = 'none';

        var promises = LOCATIONS.map(function(loc) {
          return fetchWeather(loc).then(function(data) {
            return { location: loc, data: data };
          });
        });

        Promise.all(promises).then(function(results) {
          contentEl.innerHTML = renderWeather(results);
          loadingEl.style.display = 'none';
          errorEl.style.display = 'none';
          contentEl.style.display = 'block';
        }).catch(function(err) {
          console.error('Weather API error:', err);
          loadingEl.style.display = 'none';
          contentEl.style.display = 'none';
          errorEl.style.display = 'block';
        });
      }

      refreshBtn.addEventListener('click', function() {
        refreshBtn.textContent = '加载中...';
        refreshBtn.disabled = true;
        loadWeather();
        setTimeout(function() {
          refreshBtn.textContent = '刷新数据';
          refreshBtn.disabled = false;
        }, 2000);
      });

      loadWeather();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
