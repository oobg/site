import { useState, useEffect } from 'react';
import { Container } from '@src/shared/ui/container';
import { Card } from '@src/shared/ui/card';
import { Button } from '@src/shared/ui/button';
import { CodeBlock } from '@src/shared/ui/code-block';

type JsonType = 'string' | 'number' | 'boolean' | 'array' | 'object';

interface GenerationOption {
  id: string;
  name: string;
  type: JsonType;
  maxLength: number;
  objectValueType?: JsonType; // object 타입일 때 내부 값 타입
  arrayItemType?: JsonType; // array 타입일 때 내부 요소 타입
  numberPositive?: boolean; // number 타입일 때 양수 허용
  numberNegative?: boolean; // number 타입일 때 음수 허용
  numberDecimal?: boolean; // number 타입일 때 소수점 포함 여부
}

// 랜덤 이름 생성
const generateRandomName = (): string => {
  const adjectives = ['quick', 'bright', 'calm', 'bold', 'swift', 'wise', 'cool', 'sharp', 'neat', 'fresh'];
  const nouns = ['fox', 'eagle', 'wolf', 'lion', 'tiger', 'bear', 'hawk', 'deer', 'bird', 'fish'];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000);
  return `${adjective}_${noun}_${number}`;
};

// 랜덤 문자열 생성
const generateRandomString = (maxLength: number): string => {
  const length = Math.floor(Math.random() * maxLength) + 1;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
};

// 랜덤 숫자 생성
const generateRandomNumber = (
  maxLength: number,
  positive: boolean = true,
  negative: boolean = true,
  decimal: boolean = false,
): number => {
  const maxValue = Math.pow(10, maxLength) - 1;
  let number: number;
  
  if (decimal) {
    // 소수점 포함: 0부터 maxValue 사이의 랜덤 실수
    number = Math.random() * (maxValue + 1);
    // 소수점 자릿수는 최대 maxLength - 1 자리까지 (전체 자릿수 고려)
    const decimalPlaces = Math.min(maxLength - 1, 10);
    number = Math.round(number * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
  } else {
    // 정수만
    number = Math.floor(Math.random() * (maxValue + 1));
  }
  
  // 둘 다 선택되지 않은 경우 기본값으로 양수만
  if (!positive && !negative) {
    return number;
  }
  
  // 양수만 선택된 경우
  if (positive && !negative) {
    return number;
  }
  
  // 음수만 선택된 경우
  if (!positive && negative) {
    return -number;
  }
  
  // 둘 다 선택된 경우
  return Math.random() > 0.5 ? number : -number;
};

// 랜덤 boolean 생성
const generateRandomBoolean = (): boolean => {
  return Math.random() > 0.5;
};

// 타입별 랜덤 값 생성 (재귀적)
const generateRandomValue = (
  type: JsonType,
  maxLength: number,
  depth: number = 0,
  maxDepth: number = 3,
  objectValueType?: JsonType,
  arrayItemType?: JsonType,
  numberPositive?: boolean,
  numberNegative?: boolean,
  numberDecimal?: boolean,
): any => {
  if (depth > maxDepth) {
    return type === 'string' 
      ? generateRandomString(maxLength) 
      : generateRandomNumber(maxLength, numberPositive, numberNegative, numberDecimal);
  }

  switch (type) {
    case 'string':
      return generateRandomString(maxLength);
    case 'number':
      return generateRandomNumber(maxLength, numberPositive, numberNegative, numberDecimal);
    case 'boolean':
      return generateRandomBoolean();
    case 'array': {
      const arrayLength = Math.floor(Math.random() * maxLength) + 1;
      const itemType = arrayItemType || 'string'; // 지정된 타입이 없으면 기본값 string
      return Array.from({ length: arrayLength }, () =>
        generateRandomValue(itemType, maxLength, depth + 1, maxDepth, objectValueType, arrayItemType, numberPositive, numberNegative, numberDecimal),
      );
    }
    case 'object': {
      const objectLength = Math.floor(Math.random() * maxLength) + 1;
      const obj: Record<string, any> = {};
      const valueType = objectValueType || 'string'; // 지정된 타입이 없으면 기본값 string
      for (let i = 0; i < objectLength; i++) {
        const key = `key${i + 1}`;
        obj[key] = generateRandomValue(valueType, maxLength, depth + 1, maxDepth, objectValueType, arrayItemType, numberPositive, numberNegative, numberDecimal);
      }
      return obj;
    }
    default:
      return null;
  }
};

export const JsonGeneratorPage = () => {
  const [options, setOptions] = useState<GenerationOption[]>([
    { id: '1', name: '', type: 'object', maxLength: 5, objectValueType: 'string' },
  ]);
  const [maxCount, setMaxCount] = useState<number>(1);
  const [generatedJson, setGeneratedJson] = useState<string>('');

  useEffect(() => {
    const defaultTitle = 'Raven - Portfolio & Blog';
    document.title = 'JSON 생성기 | Raven';
    return () => {
      document.title = defaultTitle;
    };
  }, []);

  const addOption = () => {
    const newId = String(Date.now());
    setOptions([...options, { id: newId, name: '', type: 'object', maxLength: 5, objectValueType: 'string' }]);
  };

  const removeOption = (id: string) => {
    if (options.length > 1) {
      setOptions(options.filter((opt) => opt.id !== id));
    }
  };

  const updateOption = (id: string, field: keyof GenerationOption, value: string | number | undefined) => {
    setOptions(
      options.map((opt) => {
        if (opt.id === id) {
          const updated = { ...opt, [field]: value };
          // 타입이 object가 아니면 objectValueType 제거
          if (field === 'type' && value !== 'object') {
            delete updated.objectValueType;
          }
          // 타입이 object로 변경되면 기본값 설정
          if (field === 'type' && value === 'object' && !updated.objectValueType) {
            updated.objectValueType = 'string';
          }
          // 타입이 array가 아니면 arrayItemType 제거
          if (field === 'type' && value !== 'array') {
            delete updated.arrayItemType;
          }
          // 타입이 array로 변경되면 기본값 설정
          if (field === 'type' && value === 'array' && !updated.arrayItemType) {
            updated.arrayItemType = 'string';
          }
          // 타입이 number가 아니면 number 관련 필드 제거
          if (field === 'type' && value !== 'number') {
            delete updated.numberPositive;
            delete updated.numberNegative;
            delete updated.numberDecimal;
          }
          // 타입이 number로 변경되면 기본값 설정
          if (field === 'type' && value === 'number') {
            if (updated.numberPositive === undefined) {
              updated.numberPositive = true;
            }
            if (updated.numberNegative === undefined) {
              updated.numberNegative = true;
            }
            if (updated.numberDecimal === undefined) {
              updated.numberDecimal = false;
            }
          }
          return updated;
        }
        return opt;
      }),
    );
  };

  const handleGenerate = () => {
    try {
      // 옵션이 1개인 경우 기존 로직 사용
      if (options.length === 1) {
        const result: Record<string, any> = {};
        let generatedCount = 0;

        while (generatedCount < maxCount) {
          const option = options[0];
          const optionName = option.name.trim() || generateRandomName();
          const value = generateRandomValue(
            option.type,
            option.maxLength,
            0,
            3,
            option.objectValueType,
            option.arrayItemType,
            option.numberPositive,
            option.numberNegative,
            option.numberDecimal,
          );
          
          // 같은 이름의 옵션이 이미 있으면 배열로 변환
          if (result[optionName]) {
            if (!Array.isArray(result[optionName])) {
              result[optionName] = [result[optionName]];
            }
            result[optionName].push(value);
          } else {
            result[optionName] = value;
          }
          
          generatedCount++;
        }

        const jsonString = JSON.stringify(result, null, 2);
        setGeneratedJson(jsonString);
      } else {
        // 옵션이 2개 이상인 경우 배열로 감싸고 객체로 한번 더 감싸기
        const resultArray: Record<string, any>[] = [];

        for (let i = 0; i < maxCount; i++) {
          const item: Record<string, any> = {};
          
          options.forEach((option) => {
            const optionName = option.name.trim() || generateRandomName();
            const value = generateRandomValue(
              option.type,
              option.maxLength,
              0,
              3,
              option.objectValueType,
              option.arrayItemType,
              option.numberPositive,
              option.numberNegative,
              option.numberDecimal,
            );
            
            item[optionName] = value;
          });
          
          resultArray.push(item);
        }

        const result = { data: resultArray };
        const jsonString = JSON.stringify(result, null, 2);
        setGeneratedJson(jsonString);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('JSON 생성 오류:', error);
      setGeneratedJson('JSON 생성 중 오류가 발생했습니다.');
    }
  };

  const handleCopy = async () => {
    if (!generatedJson) return;
    try {
      await navigator.clipboard.writeText(generatedJson);
      // 복사 성공 피드백은 CodeBlock 컴포넌트에서 처리됨
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('복사 실패:', error);
    }
  };

  const handleDownload = () => {
    if (!generatedJson) return;
    try {
      const blob = new Blob([generatedJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('다운로드 실패:', error);
    }
  };

  return (
    <Container size="lg" className="py-12 pb-32 min-h-screen">
      <div className="mb-8 text-center">
        <h1 className="mb-4 bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-3xl font-bold text-transparent sm:text-5xl">
          JSON 데이터 랜덤 생성기
        </h1>
        <p className="text-lg text-gray-400">타입과 옵션을 설정하여 랜덤 JSON 데이터를 생성하세요</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="lg:mb-0">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-semibold">생성 옵션</h3>
            <Button variant="outline" size="sm" onClick={addOption}>
              옵션 추가
            </Button>
          </div>
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                최대 데이터 수 (생성할 데이터 개수)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={maxCount}
                onChange={(e) => setMaxCount(Number(e.target.value))}
                className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="1"
              />
            </div>

            {options.map((option, index) => (
              <div key={option.id} className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">옵션 {index + 1}</span>
                  {options.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(option.id)}
                      className="text-red-400 hover:text-red-300 hover:border-red-400"
                    >
                      삭제
                    </Button>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      데이터 타입
                    </label>
                    <select
                      value={option.type}
                      onChange={(e) => updateOption(option.id, 'type', e.target.value)}
                      className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="array">Array</option>
                      <option value="object">Object</option>
                    </select>
                  </div>

                  {option.type === 'object' && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        객체 내부 값 타입
                      </label>
                      <select
                        value={option.objectValueType || 'string'}
                        onChange={(e) => updateOption(option.id, 'objectValueType', e.target.value)}
                        className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="array">Array</option>
                        <option value="object">Object</option>
                      </select>
                    </div>
                  )}

                  {option.type === 'array' && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        배열 내부 요소 타입
                      </label>
                      <select
                        value={option.arrayItemType || 'string'}
                        onChange={(e) => updateOption(option.id, 'arrayItemType', e.target.value)}
                        className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="array">Array</option>
                        <option value="object">Object</option>
                      </select>
                    </div>
                  )}

                  {option.type === 'number' && (
                    <>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                          숫자 부호 선택
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={option.numberPositive !== false}
                              onChange={(e) => updateOption(option.id, 'numberPositive', e.target.checked)}
                              className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-300">양수</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={option.numberNegative !== false}
                              onChange={(e) => updateOption(option.id, 'numberNegative', e.target.checked)}
                              className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-300">음수</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={option.numberDecimal === true}
                            onChange={(e) => updateOption(option.id, 'numberDecimal', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium text-gray-300">소수점 포함</span>
                        </label>
                      </div>
                    </>
                  )}

                  {option.type !== 'boolean' && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        {option.type === 'string' && '최대 길이 (문자열의 최대 길이)'}
                        {option.type === 'number' && '최대 길이 (숫자의 최대 자릿수)'}
                        {(option.type === 'array' || option.type === 'object') && '최대 길이 (배열/객체의 최대 요소 수)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={option.maxLength}
                        onChange={(e) => updateOption(option.id, 'maxLength', Number(e.target.value))}
                        className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="5"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            <Button onClick={handleGenerate} className="w-full">
              JSON 생성
            </Button>
          </div>
        </Card>

        {generatedJson && (
          <Card className="bg-gradient-to-br from-primary-600/20 to-primary-700/20 lg:sticky lg:top-6 lg:self-start">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">생성된 JSON</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  복사
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  다운로드
                </Button>
              </div>
            </div>
            <CodeBlock code={generatedJson} language="json" />
          </Card>
        )}
      </div>
    </Container>
  );
};

