%% الجلسة 8: قالب المشروع العملي
%  اختار رقم المشروع، وكمّل الأجزاء المكتوب جنبها TODO
%  يحتاج: Control System Toolbox و Fuzzy Logic Toolbox و Simulink
clc; clear; close all;

project = 1;        % 1: سرعة محرك DC   2: مثبّت سرعة سيارة   3: تدفئة غرفة

%% 1. معاملات النظام والسيناريو والمواصفات
s = tf('s');
switch project
    case 1  % محرك DC: الدخل جهد (V)، الخرج سرعة دوران (rad/s)
        J = 0.01; b = 0.1; K = 0.01; R = 1; L = 0.5;
        G = K / ((J*s + b)*(L*s + R) + K^2);
        uLim = [-24 24];   ref = 1;     Tend = 4;
        spec = 'OS < 5%%، Ts < 1.2 s، عزم حمل 0.005 N.m عند t = 2 بدون خطأ مستقر';
    case 2  % سيارة: الدخل قوة المحرك (N)، الخرج السرعة (m/s)
        m = 1000; bc = 50;
        G = 1 / (m*s + bc);
        uLim = [0 4000];   ref = 20;    Tend = 60;
        spec = 'OS < 2%%، Ts < 10 s، طلعة (قوة 500 N) عند t = 30 والسرعة ما تنزل أكتر من 1 m/s';
    case 3  % غرفة: الدخل نسبة تشغيل المدفأة (0..1)، الخرج الحرارة (°C)
        tau = 100; Kh = 20; delay = 5;
        G = Kh / (tau*s + 1);  G.InputDelay = delay;
        uLim = [0 1];      ref = 22;    Tend = 1200;
        spec = 'من 15 لـ 22 °C: تجاوز < 0.5 °C، Ts < 300 s، فتح شباك عند t = 600 (الخارج 15 -> 5 °C) والهبوط < 1 °C';
end
fprintf('المشروع %d\nالمواصفات: %s\n\n', project, sprintf(spec));

%% 2. فهم النظام: استجابة الحلقة المفتوحة
figure; step(G); grid on; title('استجابة الحلقة المفتوحة');
disp(stepinfo(G));

%% 3. المتحكم المرجعي: PID
C = pidtune(G, 'PID');
disp(C);
figure; step(feedback(C*G, 1)); grid on; title('PID (بدون حدود المشغّل)');
% TODO: جرّب PID بـ Simulink مع Saturation بحدود uLim ومع Anti-windup

%% 4. تصميم المتحكم العائم
% TODO: حدد نوع المتحكم (Fuzzy-PD، Fuzzy-PID، أو تزايدي متل الجلسة 7)
% TODO: حدد المدخلات ومجالاتها ومعاملات التقييس (Ke، Kd، Ku)
% TODO: عرّف دوال الانتماء وجدول القواعد
fis = mamfis('Name', sprintf('project%d', project));
% fis = addInput(fis, [-1 1], 'Name', 'e');
% ...
% writeFIS(fis, sprintf('project%d', project));

%% 5. المقارنة
% TODO: شغّل نموذج Simulink للمتحكمين بنفس السيناريو، واحسب لكل واحد:
%       التجاوز، وزمن الاستقرار، والخطأ المستقر، وأكبر انحراف بعد الاضطراب،
%       وأكبر قيمة لإشارة التحكم
% TODO: كرر التجربة بعد تغيير معامل بالنظام ±20% (اختبار المتانة)
