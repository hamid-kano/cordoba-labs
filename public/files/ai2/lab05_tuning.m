%% الجلسة 5: ضبط المتحكم العائم
%  يحتاج: simFuzzy.m و buildFuzzyPD.m بنفس المجلد
%  شغّل كل قسم لحاله بـ Run Section
clc; clear; close all;

%% 1. المتحكمين
fis3 = buildFuzzyPD(3);       % 3 مجموعات (متل الجلسة 4)
fis5 = buildFuzzyPD(5);       % 5 مجموعات
simFuzzy(fis3, 1, 0.3, 4)     % الأساس

%% 2. الزر Ku
simFuzzy(fis3, 1, 0.3, 2)
simFuzzy(fis3, 1, 0.3, 8)

%% 3. الزر Kd
simFuzzy(fis3, 1, 0.1, 4)
simFuzzy(fis3, 1, 0.6, 4)

%% 4. الزر Ke
simFuzzy(fis3, 0.5, 0.3, 4)
simFuzzy(fis3, 2,   0.3, 4)

%% 5. كل تجارب Ku على رسمة وحدة
figure; hold on; grid on;
for Ku = [2 4 8]
    [t, y] = simFuzzy(fis3, 1, 0.3, Ku);
    plot(t, y, 'LineWidth', 1.5, 'DisplayName', sprintf('Ku = %g', Ku));
end
legend show; xlabel('Time (s)'); ylabel('y'); title('أثر Ku');

%% 6. 3 مجموعات أو 5
figure;
subplot(1,2,1); gensurf(fis3); title('3 مجموعات');
subplot(1,2,2); gensurf(fis5); title('5 مجموعات');
simFuzzy(fis5, 1, 0.3, 4)

%% 7. التحدي (جرّب بنفسك أول!)
% simFuzzy(fis3, 1, 0.3, ?)
