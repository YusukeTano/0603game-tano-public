# 0603game - HTML5 Canvas 2D �����Ф����

## ��
���JavaScripthES6����g��U�_�������Ư��nHTML5 Canvas 2D�����Ф����gY����o��&f��&W!PkreY�u��4WjL�XB���D~Y

## �S��
- ** �**: HTML5, CSS3, JavaScript (ES6 Modules)
- **���Ư��**: ��������-8���� + 4��ƣƣ	
- **�����**: Canvas 2D API
- **��ǣ�**: Web Audio APIՄ����	
- **���Ф�**: PC������ަ�	�Ф����������ƣï	

## ���Ư��

### �����
```
public/
   game.js (2,358L - �����)
   js/
      main.js (�����ݤ��)
      systems/ (8����)
         audio-system.js (453L)
         input-system.js (218L)
         render-system.js (809L)
         physics-system.js (264L)
         weapon-system.js (402L)
         enemy-system.js (525L)
         particle-system.js (475L)
         level-system.js (417L)
      entities/ (4��ƣƣ)
          player.js (258L)
          bullet.js (286L)
          pickup.js (311L)
          enemy.js (510L)
   managers/ (3������)
       pickup-system.js (185L)
       ui-system.js (412L)
       bullet-system.js (304L)
```

### ����n�
- **���J**: 4,486L � 2,358L47%J	
- **���**: ����L��Wfƹ��݈��
- **�5'**: �_���L�X����kq�WjD-

## ���_�

### fh����
- **����fh**: ������!P>�	
- **�����fh**: ���������5zP��թ0	
- **���7**: �������������

### u����
- **5.^nu**: Normal, Fast, Tank, Shooter, Boss
- **�������2L**: 30�Thn��2L
- **Մ����������**: ����pk�X_�b7

### ������뷹��
- **L$���**: u�4gEXPr�
- **��ƣ����**: Common(51%) � Legendary(1%)
- **&�y**: ���ީ����JdW;��k�

### �Ф���
- **�����ƣï**: ���g�n2�ƣï�\
- **��� i**: iOS Safari�������2b
- **����-**: Portrait/Landscape!��

## �z����

### ����ƹ�
```bash
# �z����w����������K��L	
cd /Users/tano/0603game/public/
python3 -m http.server 8080
# http://localhost:8080 g����

# �Ф�ƹ� ������	
# Mac IP��: ifconfig | grep "inet " | grep -v 127.0.0.1
# �Ф�K�: http://[Mac-IP]:8080
```

### Git�\
```bash
# �������
git add .
git commit -m "_���h9o��"
git push origin main

# �����������
git checkout -b feature/new-system
# ... 	�\m ...
git add .
git commit -m "NewSystem�hq"
git checkout main
git merge feature/new-system
```

## 2L�����

### �(n4d2L����
1. **Wave����	**: ��2L�30�/����	
2. **BGM PhaseBGMէ��	**: �}2L3����Th		
3. **Player Level�������	**: L$����2L
4. **Boss Phaseܹէ��	**: %unL�	

### �������
- **����**: `Math.max(500 - wave * 50, 100)` ms
- **u�����**: �b�����+10HP, +5�, +2����/����	
- **u.�**: Wave 2(Fast), Wave 3(Tank), Wave 5(Shooter)
- **ܹ**: ����29�B�g����

## ����q;�H	

### �(nOL
- **�����q**: Wave ` Level ` BGM Phase
- **݈�'**: 4dn��W_2L����
- **2L�**: ����	n��

### �H q�����

#### �����-
```javascript
// ����h:: "���� 2-3" (2�����n3�����)
class StageSystem {
    constructor() {
        this.currentStage = 1;      // 1���� = 4����
        this.waveInStage = 1;       // 1-4
        this.stageProgress = 0;     // 0-1 2L�
    }
    
    getDisplayText() {
        return `���� ${this.currentStage}-${this.waveInStage}`;
    }
}
```

#### ��;
1. **Phase 1**: StageSystem\1�	
2. **Phase 2**: UI������ X-Yh:0.5�	
3. **Phase 3**: AudioSystemq0.5�	
4. **Phase 4**: EnemySystem��t0.5�	
5. **Phase 5**: ƹ���t0.5�	

#### )�
-  **�X�����**: 4ʄ	�jW
-  **�����
**: ��j2Lh:
-  **N깯**: ���es�k����ï��
-  **�5'**: e�j��������y��������

### ��*H�: �
�(n��W_�����;KWjL�����S�'E9�Y� i�hWf�h

## �թ���
- **�������**: 60 FPS �
- **���(�**: 80-150MB
- **up
P**: ~50-80S
- **>p
P**: ~200-300z
- **��ƣ��
P**: ~500

## �馶��
- **Chrome**: �h��
- **Safari**: iOS Safari+��h��
- **Firefox**: ��
- **Edge**: ��

## 餻�
Sn������o��z(g\U�fD~Y

## ��et
- **2025/6/11**: �������Ư���L��
- **2025/6/11**: iPhone UI i��
- **2025/6/11**: ��뷹���ա���󰌆
- **2025/6/12**: ����q;V�