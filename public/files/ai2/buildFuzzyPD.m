function fis = buildFuzzyPD(n, type)
%BUILDFUZZYPD بناء متحكم Fuzzy-PD جاهز (نفس متحكم الجلسة 4)
%
%   fis = buildFuzzyPD()             3 مجموعات لكل مدخل: N, Z, P
%   fis = buildFuzzyPD(5)            5 مجموعات لكل مدخل: NB, NS, Z, PS, PB
%   fis = buildFuzzyPD(3, 'sugeno')  نفس المتحكم بس من نوع Sugeno
%
%   المدخلات: e (الخطأ) و de (تغيّر الخطأ)، والخرج: u. كلهن على المجال [-1, 1].

    if nargin < 1, n = 3; end
    if nargin < 2, type = 'mamdani'; end
    nOut = n + 2;

    names = {'NB','NM','NS','Z','PS','PM','PB'};
    if n == 3
        inNames = {'N','Z','P'};
    else
        inNames = {'NB','NS','Z','PS','PB'};
    end
    if nOut == 5
        outNames = names([1 3 4 5 7]);
    else
        outNames = names;
    end

    isSugeno = strcmpi(type, 'sugeno');
    if isSugeno
        fis = sugfis('Name', sprintf('fuzzyPD%d_sugeno', n));
    else
        fis = mamfis('Name', sprintf('fuzzyPD%d', n));
    end

    % المدخلات: مثلثات متداخلة بانتظام
    w = 2 / (n - 1);
    for v = ["e" "de"]
        fis = addInput(fis, [-1 1], 'Name', v);
        for k = 1:n
            c = -1 + (k-1)*w;
            fis = addMF(fis, v, 'trimf', [c-w c c+w], 'Name', inNames{k});
        end
    end

    % الخرج: مثلثات (Mamdani) أو أرقام ثابتة (Sugeno)
    fis = addOutput(fis, [-1 1], 'Name', 'u');
    w = 2 / (nOut - 1);
    for k = 1:nOut
        c = -1 + (k-1)*w;
        if isSugeno
            fis = addMF(fis, 'u', 'constant', c, 'Name', outNames{k});
        else
            fis = addMF(fis, 'u', 'trimf', [c-w c c+w], 'Name', outNames{k});
        end
    end

    % جدول القواعد: كل ما زاد e أو de، بيزيد u
    ci = (n + 1) / 2;  co = (nOut + 1) / 2;
    rules = zeros(n^2, 5);  r = 0;
    for i = 1:n
        for j = 1:n
            r = r + 1;
            o = min(max((i - ci) + (j - ci), -(co - 1)), co - 1) + co;
            rules(r, :) = [i j o 1 1];      % [e de u الوزن AND]
        end
    end
    fis = addRule(fis, rules);
end
