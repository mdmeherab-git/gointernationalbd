import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Svg,
  Circle,
  Path,
  Rect,
  Line,
} from "@react-pdf/renderer";
import type { CvData } from "../types/cv";

/* =========================================================
   GO INTERNATIONAL BD — CV PDF TEMPLATE
   Reference-matched fixed layout.

   IMPORTANT:
   - No external icon/assets dependency.
   - Every section is positioned with fixed coordinates.
   - Personal Information replaces About Me.
   - Job Experience is intentionally compact.
   - Text is clipped to its own box so fields cannot collide.
========================================================= */

const TEAL = "#08A99D";
const MINT = "#D8EAEA";
const DARK = "#303438";
const MUTED = "#4B5559";
const WHITE = "#FFFFFF";

const CV_LOGO_DATA_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmQAAAMYCAYAAABlhvuyAAAABmJLR0QA/wD/AP+gvaeTAAAgAElEQVR4nOzdd5gkVb3/8Xfv7szuknNGkiIoJkAUUMEAiqKYuGbMmMV40Wu8hisq+lPMWcEEgigIKmACRJSgkpQkSBIkLiybd87vjzMryzKhQ1V9q6rfr+f5POjsTPe3Tld3na46dQ5IkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkqQYnegCJEkqU4KHA7sCmwEbAbcBNwEXAGd1YHlgeZIkSe2UYN0EH01wVYI0RW5O8NUEW0fXLEmS1AoJOgnelODWaTpiq2ZRgsMTzI7eBkmSpMZKMDvBd3rsiK2asxJsEr0tkiRJjZNgVoJTBuyMrcgVCdaP3iZJkqRGSfC5gjpjK3J6gtHo7ZIkSWqEBPsU3BlbkXdGb5skSVLtJZiR4LySOmS3e+lSVZkRXYAkSQPYF9i5pMdeBzi4pMeW7sUOmSSpyZ5d8uM/q+THlyRJarYE15V0uXJFxhJsHL2daj/PkEmSGinBXGDzkp+mA2xX8nNIdsgkSY21aUXPs1lFz6MhZodMktRUcyp6nrkVPY+GmB0ySVJT3VjR89xQ0fNoiNkhkyQ11e3Awgqexw6ZSmeHTJLUSB1IwOklP81NwKUlP4dkh0yS1Gg/Lfnxf9KBsZKfQ5IkqbkSbJBgXolzkD0qehslSZJqL8F7SuqQHRO9bZIkSY2QYLUEl5SwsPi20dsmSZLUGAm2SXBzQZ2xZQmeGr1NkiRJjZNg9wQ3DdgZW5TgxdHbIkmS1FgJtkpwXp+dsesS7B69DZIkSY2XYEaCAxNc1WVHbH6CwxKsGV27hlcnugBJksqQYATYC3gmsCuwBbAhcBvwL+BC4ETgFx2YH1WnJEmSpBrwDJkkaaglmAnsDDwe2I58Jm0UWEZex/IfwO+BszuwKKpOSZKk1kmwaYIPJbixhzswf5fgTQnWia5fkiSpsRLMSvD2BHcPMD3GggTfSvDA6O2RJElqlAQbJfhDQRPIpgRLE3w9wcbR26ZmcwyZqtQBNgW2AjYjf4BtMJ71yXc/rQfMBlYD1iKP41hrksdLwB3AwvHcASwA7gT+DVw//t9/ATcC1wHXAGOFb5mk2kuwPXAyeZxY0eYDnwEO78C8Eh5fLWeHTEWbBWwD7DCe7ckffvcDtiR3sCItJg/QvXw8VwAXA3/G296l1kqwCfAn8udQmW4DPgEc0clfFKWu2CHTINYFHjGeh49ne+I7Xf0YAy4Fzlsp5+IHqtR4CeYAvwEeXeHTXg98CPhmJ9+tKUmFmEW+LfyNwHeBK8mXDNucReQP8fcBe4y3gaSGSXBkgWPGes1fU7UdQUktMxPYDXgXcCr5cl50Byk6dwEnAa/FAbxSIyR4ZWBnbEXGUu4Urh/dHpKaYQvgYOB48gD56A5QnbMM+C35jOFmfbS1pJIleEgabGqLonNDggOj20VSPe0MfIQ8qD26k9PULAfOAF7N5HeESqpQgtUTXFKDTthEOTLB6tFtJCnezsDHyHcYRndm2pb5wLeBx+FNM1KYBN+tQcdrqlyc4MHR7SSpepsDh+CZsCpz2Xib+01YqlDKSxtFd7i6yd0J/iu6vSSVbxR4HnAa+bJadAdlWHMr+YzkFlO/XJIGlWDPBIsDO1m9ZizBW6PbTVI5NgMOBa4lvjNi7skS4EjyXG2SCpZgi9T9QuFlZZ8ET0jw6QTX9/B3745uP0nF2Yl8wF9KfOfDTJ7lwDHklQwkFSDBGgnO66EDVFaevlJNowkOSnBVF383luCgyDaUNLg9gBPJs81HdzZM91kGHAVsfZ9XVFLXEowk+HkXnZ4q8tIJ6pud4NAEC6b528Up33QlqWEeQ+6IRXcszGBZDHyFvLi6pB4k6CT4xjQdnSpz6BS1PjDBWdP8/fnJO7SlxjgAOJ/4joQpNrcB7wBmI6krCT44TQen6nx2mnpnJTg85UuUkz3GY6tqP0n92YW8tmJ0x8GUmyuApyJpSgkOnqRDE5lju6z9wASLJnmM/y677ST1ZwvyJS2nrhiunAhshaT7SHBImvos00T5TI+/30/+0MM2nD7JY3yvzLaT1Lu1yPNXLSC+c2BiMp/8bXkESaQ8ZuzDiZ46ScsTvHb87//a49/2mn/2sC2fnuQxLiqvBVVXs6IL0IQ6wMuBw3Cg97BbHfg4eYLflwEXhlYjTSPlz6+nA88F1geuG/+nWcCak/zZCLDGJP82yr1Xu1gLeEAPJS0BDurA0eP//2fAQ3v4+15tmmBGJ9/1Pp1zJ/n5AxPM6cCiIguT1JttgFOIPzNj6pcl5E66Z8tUSylP7/CTxH/O9ERP0jo/wVNWqXGXCp53sy7ba/spHmOXcl4lSdOZRV738C7iD/ym3vkL8HCkmklwWOJenYrIDtkNCXadpM4rS37ux3XZXp0Et0/yGK8o9tVR3c2ILkBAPrieDXyGyU/bSys8jDxw+I3RhUgrpHw8eVV0HeMuAB7dmfyS4PElP39Xy6N18hes8yf554cVV46awA5ZrBHgo8A5eHpavZkDfA74MbBucC0S5P1w/egiyJ2tPTtwzRS/c1zJNfSyXu15k/zcDplUka2B3xN/+cs0P9cAeyIFSnn82LJE2CXLJQnelrqY5T7lS4XXlljLCT20239N8hi3d7MtkgbzYmAe8Qdy054sJU+P4Qe4wiT4RSKkQ3Zlgt17rPXwEuu5bvoK/lPHtlM8ztY9vwiSurImeYLX6IO3aW+O4d5TBEiVSfCgdO9B6mV3yJYlOCL1sc8neEjJtW3cZR2dBLdO8hgH9P4qSJrOrsDlxB+wTftzPs7wryApT+Xw0wRLU3kdsmUJfpxgpwFrPa+k+lLqYfmzBKdM8hjvH2T71CxODFuNFwJfB+ZGF6Kh8AjyQOEDyWufSpXpwGXAASmftbofsFoJT3NNB24u4HG+A+xcwONM5NHAyV3+7rnAPhP83IH9UkFmAZ8m/oyJGc4sAQ5G0oQSrJ9gcaKUM2S9rGn57Eke44oyt18aFuvhjPumHjkMB/tLE0r3Xlmg6Muq63VZw/0meYyxlJeKktSnBwJ/J/5AbMyKfBuXXJLuI8EzE6WNI/uvHuq4aZLHcEqbIeHEsMXblzzR6wOjC5FW8lLyJLJljOeRmuxkihmPNpGX9/C7k60q4DiyIWGHrFgvAX5Gnt5Cqpv9gV8BG0QXItVFJ4+1/H5JD79vgvt3+bvO2D/k7JAV5xC8LKT6ezRwOrBpdCFSjXyJfGm/aDOAN3T5u54hkwbUAT5J/BghY3rJ34DNkARAglMTpYwjm5+6OCudYON036WnVvz9zCraQLE8QzaYEeBo4B3RhUg92gE4Dc+USSt8saTHXZ18BWVKHbgJ+NGqP0+dzhV4rJamNAocT/yZDmMGyaXA5khDLsGsBNckSjlLdmPqYjhLgjUTfD3l5aduXDw6ctGCOaOLF8yd1dM6ndIwmQ2cSPzB1JgichmwCdKQS/DuRGlTYPS8LuWCuSNHLJgzmhbMGb3mzjW9GUda1WzgBOIPosYUmQuAdZGGWIJ1E9yVKKVD9r0+6hlZMGf0rAVzRtPCOaMnJSd4lv5jLs6+b9qb03G9VQ25BJ9JlNIhuzX1MTh/4dy591swZ/SWBXNG04K5sx2vLJGv/3uZ0rQ9J5LXYJWGUoKtEyxNlNIp27Wfmu6ePftpC+aMji2YM7p0wdxZztyvoTaDPHFg9MHSmCpyFF4a0RBL8INEKR2y1/db04LZo58YH092rePJNKw6wFeIP0gaU2UOQxpSCfZLlNIh+/oANc1aMGf26ePjyU5OfmlqHec2md4ngIOji5Aqdih5/UtpGO1f0uPer98/7MAyOjNeCJ2bE+y3cO7oO4ssTKq71xB/psKYqCwGHoc0RBI8L8HyRClnyC4etL6Fc+Y8YcGc0WUL5owuXTh31mOK2Gap7p4GLCP+oGhMZG5kgG/1UpMkeFaCxYlSOmMpwbwi6rx7zuiHBh1PlmD9BK9PcHSCP6W8dNQXEuyfXKpJNbILMJ/4g6Exdcifycu/SK2V4L9TeWfGVs7A76UEM+6eM3LKSuPJehp+lOCgBLdNUeNFCXYetE5pUFuRzwpEHwSNqVOOw0HEaqEE6yT4YaL0jtiKFDIB811rrLHRgjmj1+f5yUYP7XJbN0/wsy7rXJDgyUXUKvVjLnAu8Qc/Y+oYBxGrVRLskeDKRGWdsZRgraLqXzhn1l7/GU82Z9Zjp9nWA1OenLaXWucneHBR9WpqfuO9Rwf4AfC86EKGSAKuBi4BrgSuBa4DbgFuBxYAdwN3rfJ3y4E7V/r/K75xrg2sR16XcUNgM+D+wPbj2aiEbRgmS4G9gD9EFyINIsEawIeAQ6h+toG1Ovf9TOvbwjmj703wYeC6ZSNLHrHWXdyy8r+nPAb0a8C+fT7FX4BdO/lzV6rEu4g/A9H2XAEcCbwOeCT5Q7FKGwFPBd5PnpF+Xg+1m5yrcc1LNVjKZ4quTVR6VmzlFLo8WYIZC+eM/nzV8WQJOglek2BeATW/psiapak8kdz7jz7YtS03kztgzwM27vrVqM4sYHfgfcDZwBjxbdaE/ATPrqthEtw/wcmJsI5YSgXdZbmqeWux3oI5o1ePd8renfLyT6cWWPdVySXVVIFNcRB/kbkS+D9yR6dpt05vSb6EcRbx7Vj3HNJnG0uVSrBugo8nWJQI7YylBH8vazsXzJ21x4I5o4sWjcw6JcFdJdT+/LJqlyB3GH5D/MGt6bmDvCTIY2nPmZMdgcOBfxPfvnXMYvL0MFItJZiT4B2p94HsZebXJW7v9mOdzh9KrP2i5Oo+KtF7iT+wNTl/Al5IwWMiamYO8ErgIuLbu265CJjdf9NKxUswI+VxYv9IhHfAVs0XS9rmAxIsrKD+55ZRv7QLsIT4g1rTMkYeEL9X703eaB3y6g1Oi3LvfHSQRpWKknJH7IAEFyQK6XzcnOAjCXZLea6yNRI8IcF3B3jM15e07ecVtM3T5S+pPVdBVBNzyVMtRB/MmpSlwDfIl/KGWQc4gLwmXfRrUocsBXYdqEWlASVYM8HPE4V0OhYm+FSa4m7iBM9PsKSPx969pO3/VUHb3k2eWcY2aHgdQfyBrEk5FXhIXy3dXrPIA9udOiN/uZkzWHNK/UkwkuC0xMAdjSUJvpxgiy6f9/U9Pv78BCMltcGzCtj+bnN+8iyZCvJ4nN6g25wD7N1XKw+PzYEfEv9aRcdLlwqR4AOJgToYYwmOSrBtj8+7U4/Pc1qJbdBJcOGA7dBL9i9rWzQ8ZpNvO44+eNU9NwAvwm9BvXgCw71veelSlUvw4NTfpcMV+VOCR/f53Pv1+FzfKnr7V6nnxQO0Q685N3l80IA+RPyBq+45Bli/3wYecnOAzxL/GkblXLwtXhVK8P1EXx2KmxO8Mg2wvyY4uMfn/ESR2z5BPTMTXNZne/ST/crcHrXbDsAi4g9adc2NwLP7bl2t7NnAbcS/phF5dQHtJ00rwbYJliZ67kiclPI6t4M+/wd6fN53FLHd09TUaydxkLimrfoyAziT+INVXXMMsEHfrauJ3A84g/jXturcimdYVYEEhyd66kDMT/CSAp//iB6f/2VFPfcUNY0k+GePdQ2SfcreJrXP64k/UNUxd+JyGGWaBXyB+Ne56ny+iMaTJpPyIPZeOh6XJdip4Bp6vVz6tCKff4q63tJjXYPk91Vsk9pjE5yaYKJcSL6Mq/K9leFavH4Z8LBCWk6aQII9El13Gs5NsGEJNfyshxpSgt2KrmGSulZLcFOPtQ2Sx1exXWqHbxJ/gKpbfgSsPkijqmcHAPOJf+2ryul4F5ZKkvLErd10Fi5PJV1CT71PxrpNGXVMUtt7eqxtkPymqu1Ss+3CcJ2ZmC5jwEfwQBllV/LNE9H7QVV5XjHNJt1bgnMSXXUWDiixhrO6rGFF1iirlglqWyvB7T3WN0geV9W2qZk6OJB/5SyhwAGt6tsO5HneoveHKnIZeRydVJgEq6fu7q4cS1Msf1RAHed3UcOKLCirjinq+2gP9Q2aU6vePjXL84g/INUld+OcMXXyQIanU/aqgtpMAiDlBb676SRcUnIdvSzo/c8ya5mkvvUT3NVDjYPmMVVvY9u0dRLHEVzKZYXbybcm/zy6EP3HpeSBsDdEF1KB9+M6lyrWnl3+3h9LrSKvTtGtf5dWxSQ6eQqar1f4lO+p8Llaqa0dslcA20UXUQO3A08CzoouRPexolN2c3QhJdsSeG10EWqVbs/ElN0hW9LD70a9zw8HFlf0XE9J3XeWNSTmANcSf6kmOndQ0W3WGsgjaf/dlzcDaxbVYBpeKU982u1luJ1LruXULutICY4ss5Zp6vxqD3UOmp9FbWcbtPEM2RuALaKLCDYfeDLwp+hCNK1zgBeS7wZuqw2AQ6KLUCvsSnd3Ky4ALii5lht7+N3KL1mu5DDy3IBVeFrKXzLVh7Z1yFYDDo0uItgS8lqKZZ+uV3FOAN4YXURJ7gCOB64OrkPtsHeXv3dep/xOyHU9/G7Y0IQO/AM4usKndCyZAHgT8ZdnIjMGHDRwKyrKF4nfhwbNMuBc8rfyJ5FvsJEKkeAXXV46+0QFtbyxy1pSyuOawyTYMcHyHuodJGMpzwGqITZC/hYefUCKzDsGbUSFGiXfgBG9H/WavwFHAE/HsWIqSYJZqfvxY8+toJ79u6wlJXhG2fV0Ue+Pe6h30Bwbvb2KdRDxB6bIfGfwJlQNbAJcT/z+NFVuBo4BDga2KqcZpHtL8KgeOgRbVlDPpj3UEz6TfYJHpHz2qqqzZA+N3mbF6AAXEX+gisrvgdkDt6Lq4onUa8mvhcBp5PGZO9O+sadqgASHdtkZuL7Cmi7vsqZfpxqsWpHgl13WW0SqHLemGtmH+INWVK4HNh68CVUznyRunxoD/kqew+jJ5JtlpFAJTu6yI/DjCms6vIcOymeqqmuKeh/XY6dqkCxPsFP0Nqt6JxLfMYrIcvLZFLXPbODPVLcv3cQ9lyGHfdoY1UzK48fmddkR+O8K69o+9TZYPnRw/3jNp/fZweon34veXlVrO+p1eafKeHtxuz2MvDxLGfvOfOBk4K34LVY1l2C3HjoBe1dc2zd7qG1hynOphUl5Rv2qOmTLUl67V0Pi08R3jCLySxzLMwwOp5j9ZTl5ouCPkg9YoxVugzSQBO/soQPQzcSxRda2VoK/9dBJuSYFDzNJcE5JHbCJ4g1nQ2Iueb3G6M5R1bkN2LyA9lP9rQH8k/72k6uArwIHAutXXbhUlAQndXnw/0tQfVuMd7S67aT8PgV+KUrwnAo7ZMsSbB+1rarOi4jvHEXkRUU0nhrjmXS3X8wHTiXfDenEjGqFBDMT3NHlwf/LgXXulOD2HjoqXwistZPgwgo7Zd+M2lZV5zTiO0dVp7I7iFQrE924shQ4E/gAsAc1uK1eKlqCR/Zw4H95cK2PT7Coh3pfHVjrSyrskC1JsG3Utqp8WzN8g/lvxykuhtVO5P39UuDzwAHAWqEVSRVI8I4eDvwPqkG9z0/dT8C6JMFjg+qcmbqfR62IfDViO1WNDxLfQao6by6i4dRYG0YXIFUtwYldHvDnpZrc6JTgXT10VP6VgsYEJ3hNhR2yJSmfSFELXUZ8B6nKXIV3xkkaIimfxel2XNap0fWuLMFne+is/CEFrLaSYHaC6yvslH2p6m1U+XYlvoNUdQ4qpOUkqSES7NLDwf4j0fWuLMGMBMf2UP+3g+p8W4UdsgXJO75bp6i5mZqSv+OAbUlDJsHbezjYPz263lUlmJPgjB624bUBNa6e4OYKO2VvrXobVZ4ZwDXEd5KqzHMLaTlJapAEJ/RwoK/lDU8J1k5wQZfbsCTBXgE1vrfCDtkvq94+lWd34jtIVeZv1GSgqiRVJeVLfrd1eZD/R3S9U0m9TRx7Y6p4PdkE66Tu53obNHdVuW1N0sQD/QHRBVTscGAsughJqtjDgXW7/N2zyyxkUB24DngqcEcXv74x8NOUV6KpRCfX9cWKnm6N5JQ9rXEJ8WetqsoNBNx5I0nREry1h7Muh0TX243U28SxR1Zc20YJ7q7oLJmTxLbA/YnvJFWZDxTTbJLULAl+0sMB/tHR9XYr9TZx7Jsqru0zFXXINqlyu1SOtxPfSaoqS3EBcUlDKOXxY7d2eXBfnGBOdM29SN1PHFvpIP+Ux7otLrkzdleCTlXbpPL8gviOUlU5tqA2k6RGSfDwHg7wf4yutx8JPtfl9t2SYJsK6/payR2yWk3gq/6MAvOJ7yhVlX2KaTZJapYEb+nhAH9EdL39SHkVguO73MY/J1itorrun2BZiR2y11SxHSrXY4nvJFWV64CZxTSbJDVLDx2VlOBF0fX2K8HcBGd1uZ3frbCu75XUGbslwepVbYfK80HiO0pV5bBimkySmiVBJ/U2c/z9o2seRIINElzW5bZWMst9ggclWF5Ch8yzYy1xOvEdparykILaTJIaJcHDejjA35JaMEA8wXYJbupie5cleEpFNfVylrKb/CI1c+5TrWI1YBHxHaUqcl5BbSZJjZPgzT0c5E+KrrcoCXZL3c0DdmuC7Sqo55EFdsb+lrqf5HdoNaW3+liGZ4LUo6MLkKRAe/Xwu428w3IiHfgT8FKmX5llPeDYVPIg/w6cwz13RN4CfJ28+Pm+wH7koTW3d/FQFwJ7d7r7XTXAJ4g/c1VVHlhQm0lSo6R852G361emlDsHrZK6X6HguFTy5doEuyQ4ME1yQiTl2f1/O0WNJyRYp8waVb0/Et9RqiKXFNVgktQ0CfbsoTM2llp6GSzB/+uyDf67onpmLR8ZecvykZG/Lh8ZWbx8ZOS2sVmzfpJGRnZLMCfBGavUtTTBu8vuMKp6I8BC4jtLVeQjBbWZJDVOgg/10CH7W3S9ZUl5pYJju2iD5SkvWl5mLbPGRkdPWj4ykibI0mWjowcm2CzlGyxSghsTPKnMmtpqVnQBXdiJhi2LMYAToguQpEC3dPl7twLvmuLfR4D1V8oG4/9djzx2eu3x35vNPWOxFgCLx//3PPJYrtvGa7p1lSztss6+dPLZv5cAmwJ7TPGrM4CjEuzWgSvLqGVsZOSVpDRZp29WJ6WvklcSOAR4MXBQB24uo5a2a8LpxFcBX4suogK3ABsz/YBOSWqtBG8D/o+Jxy0tA74NvK8DdwIPBh5E7hBsvdJ/N6e8ybWXkyfvvno8V43nb8DF5I5dIVLuRJ4FbD/Nr14E7N7Jq9kUatnIyG86sPdUv5M6nRfMXLLkaKDT8RjWtyacIdsluoCKnIo7sqQh14FPJzgOeAWwJ9BZBIt+D/9+J9z6Z9iKPC/ldsTMFDCTXMNW3PeO0OXkM1UXjOfPwB/IZ9V61slTXOw3/hgbTfGrOwHfAg7s53mmqWGraX9nbGzrzj1Db9QnO2T14YKrkgR08tmxq8lnuvYAdqAZV3Rmks9mbQ88d/xnCfg7+UzXmeO5otsH7MA/EuwP/Iaplx0q6waHu6b9jU7nzpKee6jUfQcfIZ+WHoYxZFsB10QXIalnmwIPJS/hsxX5ktkW5E7Filv+55PHHd0G3EB+r19HPoPyF0oek9QAq5E7Xk8CDiB3wNrsKvKX8NOAX5KPc1MaP1P2FWDLCf7538BendzxK9TykZHPAm+eqrQZnc5OnSVLnCVgQHXvkD2c/IHVdpfS/g8gqQ1WB3YnX6p6FPAwpr6U1I3F5M+5XwM/InfQhsFGwHOAZzNck3+vajH5EuyPyZdqJx0Qn/IZuMeRx3StGFd2HnBUB24qo7g0d+4WY8uW/YU8nm0i35m5dOnLynhu1csriZ+Koop8oagGk1S4B5Hv6DsTWEL5nwdnUfJUBoHWBQ4CTqSatmxalpH3s0MYvKNfmDQy8rDxOcjuNeXF8pGRL6Th7UgPnf9H/Bukiry4qAaTVIgdgA8DlxP3ufAjYM2yN7QCM8kdzOOxE9ZLlpDPmO1HDZY5TNBJIyO7LRsZeemy0dHnJNgkuiZV62fEvymqyHS3NEsq32rAq8lrCkZ/JqzIn2lup2wz4FDyeKnodmx6rievHbl1Ly+AVKRLiX8jlJ1bqcE6FbUAACAASURBVP9YPqnNNgM+RV78OPrzYKJ8t7xNL8UewLHky2/Rbde2LCOfOX1016+GVIBZDMfp7ZOLajBJPdmIfNZhAfGfA1NljPrf9DMDeDp5/FN0ew1LziWPxytrAlzpP7YnfoevIh8sqL0kdWdT4DPUvyO2cj5USksMbhbwcvK8WtFtNKy5DHgpdsxUoqcRv6NXkbbeTSXVzSj5bsn5xL/ve82vS2iPQcwgzwo/DMNKmpJ/AAdjx0wleAvxO3gV2aKoBpM0qSeS1xqMfr/3m38V3yR96ZBnoL+Y+DYxE+dC4FmTvYBSP75I/I5ddubhgH6pTOuQB8VHv9cHzRjxS93tDPyO+LYw3eW35MnVpYH9gvgduuz8obDWkrSqvchLFEW/z4tK1ESh6wOfxbsmm5jlwJHAxvd5VaUe/JX4nbnsfKOw1pK0Qgf4X/LBKPo9XmS2KrKRujATeCv5TH70tpvBcgfwJmowwaya6Rbid+Ky8/bCWksS5LUmjyP+vV1GJlpUuiwPAc4uaTtMXM4DHoHUg1HymInonbfs7FdUg0liA+B84t/XZaWKG4BGyLPrLw7YPlNNlpDn33MNSnVlK+J32iqybVENJg259YG/EP+eLjPrFtZaE9uFZt+JanrLxXi2TF3YnfidtewsJ58JlDSYdYBziH9Pl5kllHdHdgc4BM+KDWOWkCcnd2yZJvVs4nfUsnNDYa0lDa91qNdi4GWlrHnItgR+U4PtM7H5Fc6JGa6uveJNowuowHXRBUgNtw5wKvDI6EIqcEsJj/kM8t3se5fw2GqWJ5Av+btyTKC6dsg2jC6gAtdGFyA12NrAL4FdowupyJUFPlaHPHD/eMofl6bmWB/4GXnAf137Bq1W10ZfO7qACtghk/qzFrkztlt0IRW6rKDHWQ84GQ+6mtiKzvqJ2FmvXF3fkMPQIfOSpdS71ckHi0dFF1KxIjpkDwXOBZ5SwGOp3Z5KHpv54OhChkldO2RrRRdQgeujC5AaZk3gFOBx0YUEuHzAv38ScDqwTQG1aDjcn7y8n/NlVqSuHbJhOEN2W3QBUoOsCfwc2CO6kAAJuGiAv38F+TLlMHyuqlhrAicAr4kuZBjUtUO2TnQBFbgjugCpIVYjHxT2jC4kyBXArX38XYc8x9Q3yDPwS/2YBXyZvMB8XfsMrTAruoBJDMM3uXnRBUgNsBr5zq+9g+uI9Kc+/mYmuSP20oJr0fB6M/n9+FryxOYqWF17u6tHF1CBO6MLkGpuNeAk4PHRhQTrtUM2C/g2dsZUvFcB38MzrqWoa4dsGJYU8gyZNLm55Lsp9w6uow7O7uF3ZwM/Al5cUi3S88hz2M2JLqRtylobbVB30O7LlsvInc4UXYhUQys6Y0+MLqQG5gMbkNeZnM5qwE/Jd1RKZTsFeCawMLqQtvAMWYw7sTMmTWTFGR47Y9mxdNcZGyW3m50xVWVf8heA2dGFtEVdO2R1vdmgKHdFFyDV0BzyB/zTogupkW918Tszge/iOoSq3j7AD2n/MXtodYhd9b6KXFFYa0ntMEq+TBn93qxTzu2i3WaQB1lH12qGO0dR3xM8jVHHXq13b0jDZTbwYzzDs6pPdfE7XwFeWHYhDXc3eaWDq4EbgJvHs4j73u2+FvlM7Ybj2Yy8usEDyGP0NLEXk6/8vD66kCarY4dM0vAYJY+TsjN2b5eTx4RN5b3kaQh0j9uBs8hnF88B/kpx6wZvATwc2BV4JHnViGGYxLxbrwP+CXw8uhAVZybxp1/LzqDr0kltMAL8hPj3Yx0z3VmvFwFjNagzOsvJa3S+m9xJmjlNuxVpJrAb8D/AmeO1RLdHdMbI02KoRdr+QXNZcU0lNdIIeS6j6PdiHXMRU4/H2Yt8uS26zsicAbwB2HSKdqraZsAbgd8T3z6RWcjwLnPWSkuJ36nKjB0yDbMR8pix6PdhXfPsKdpue/K6ltE1RuRm4JPADlO0T13sSB4DeAvx7Rb1Wm03cCuqFtr+7e/S4ppKapSZwA+Ifw/WNWcw+YTda5DPnkXXWHWuBA6hmYPqZwMHAX8jvh2rzgUMxzKIrTef+J2pzNgh0zCaBRxD/PuvrlkGPHSStusAR9egxipzGXksXRumU5hJHvd3OfHtWmW+W0TjKdbNxO9IZebqwlpKaoYVk5dGv/fqnM9P0X5vr0F9VeV64JW0cxaAEeDV5Ok3otu5qrypkJZTmKuI34nKzO3FNZVUezOB7xP/vqtzbgXWn6T99qb942oTeYmojwNrTtIObbIWeTzcEuLbvewswUH+jdb2cRLLqO/C7lKRZpJn8Y5+z9U9L5+k/dYDrq1BfWXnTJoxWL9oOzIcd2VejXO2NdbZxO9AZWeNwlpLqqcZwHeIf6/VPb9i8i9oP6xBfWVmAXAo1c4fVjcd4GDaP3Z6uomOVVOnEb/zlJ3NCmstqX7sjHWX+eSleSby8hrUV2b+DDxwkm0fRjuSVxaIfl3KzEsKay1VZhjuJhrG0/MaDh3gy8S/x5qQN0/ShtuS11mMrq+sHEkzp7Eo2xzgs8S/PmXlLvK6oGqQzxO/45Sd3QprLak+OsCXiH9/NSFnM/Gluhnk5YCi6ysji4CXTbDNurcXkC/nRr9eZeS3OIa6Ud5P/E5Tdp5UWGtJ9dABvkb8e6sJuZvJz5K/rgb1lZHrgUdNss26r52Ba4h/3crIqwtsJ5WsrR9IK2eq5VGkptkM+Drx76umZLID0ubAvBrUV3QuAraYZJs1uS2Bi4l//YrO7dRrHVJN4TnE7zBl5/WFtZZUvRnALuQ75M4Exoh/TzUlx03Rrm1ccP1sYIMptllTW5f8Hot+HYvOsUU2ksrzOOJ3lrLzscJaS6rGesCBwFcYrpnGi8y1TD4BbBu/iP4SmDvJ9qp7qwGnEv96Fp0DimwklWMH4neUsuMaX2qChwHvJn9DX0b8+6bJWUb+sjmRubRvhRI7Y8WaS/s6ZVeS7yxVja1J/I5Sdk4vrLWk4qxGvuHks7R3QHFU/neKdn9vDeorMqfggbYMc8kTCUe/vkXm0EJbSKVo+wLj/yiuqaSBPAB4C/kguoj490YbczqTL5a9Oe2apf0cXImkTKsBZxH/OheVO3GAf+39ifgdpcwsJg+Mlqo2G9gH+H/AZcS/F9qe64BNpng92rTW5+XAxlNsq4qxAfB34l/vovLNYptHRfsu8TtJ2fFbgaqyEXAQcAztnFahrlkCPGaK1+URtOcO1ZvJKwyoGtsBtxD/uheR5cBDim0eFekDxO8kZcfZ+lWWmeRpKT4InEt7DvpNy3QTYJ5YgxqLyBLg8dNsq4r3WPLVlujXv4j8uOC2UYGeT/wOUnaeU1hrSXk6hRXTUvyL+P172POVqV8uHlWDGovKwdNsq8rTlonUx8irE6iGHkH8DlJ2/ruw1tIw6pA/wN5DHuTrtBT1ydnksXpT+WUN6iwi359mO1W+I4nfD4rIiUU3jIqxBu2/zPKDwlpLw2JN8rJbX8fJWeuaG8l3Tk7lsTWos4hcAqw+zbaqfGvQnkH+rndaU9cRv3OUmasLaym12QOBtwGn0Z7xIm3NAmDPiV/GezmpBrUOmoXATl1sq6rxMNoxbc1Pim4YFePXxO8cZccFd7WqOeTJWQ8jn4GI3kdNd1lGPns5nR1ox9n/t3exrarWu4nfLwbNGLBj0Q2jwX2R+J2j7DyvsNZSk90PeC1wAnA38ful6S1jwMvv86pO7Bs1qHfQnEm+k1f1MgM4g/j9Y9B8ueiG0eAOJn7HKDufK6y11CSzyOsaHgZcQPx+aAZLtzfobEzzLystBO7f5faqejvQ/KENC8hzJ6pGdiV+xyg7lxbWWqq7DcjTUhwJ3Eb8vmeKyRF070M1qHfQfKCH7VWMDxO/nwyaDxbdKBrMbPKEg9E7RtnZrqgGU+08mLx47qnAUuL3NVNsjiJPP9KNWcD1Nah5kFyOi4Y3wWzyl/3o/WWQ/IvJ139VkL8Qv2OUndcX1lqKtjrwdPKkoG2/S3jYcyK9HTCeVYOaB81Te9hexXo68fvLoHlG4a2igXyT+J2i7Py0sNZShG2BQ8hnwZo+dsN0lz/Q+/xbP69B3YPkVz1ur+KdSvx+M0hOKL5JNIg3Eb9TlJ35TD+rt+pjLvdMS/E34vcfU20uBNalN1vS7JUUluOyNk30cPJrF73/9Jtl5PeOauIxxO8UVeTJRTWYSrE1+dLySeQ7gKL3FxOTfwCb0bv/rUHtg+SoPrZZ9fBD4vefQfLe4ptE/Vqd4RjY/62iGkyFGAEeD3wCuJj4/cPE5ybgAfTn8hrU32+WkVeLUDM9iGafJft78U2iQfyJ+J2i7MwjXwpTnJWnpbid+H3C1Cfz6P+SXdOn7/HsWPM1/SzZQ4tvEvXrcOJ3iCryrKIaTF2ZAexCnpbiTJr9LdKUl8XAPvTv4zXYhn4zRj7DomZ7KM1erusjxTeJ+nUA8TtEFTm6qAbTpFaelqLpc0KZ8rOMfNa0Xx3gqhpsR785aYBtV72cQvz+1G+uKKE91Kf1GI6zFwuBtQpqM93DaSlMPxkDXs1gdqvBdgySQc4Mql72I35/GiTe5VsjFxG/Q1SRFxXVYENsFHga8CXgn8S/pqaZeQ+D+2gNtqPfXET3qxCo/jo0e5qeDxbeIurbl4jfIaqIlwj6MxN4AvA14FbiX0fT7HyGYpxfg23pN28pqA1UH+8gfr/qN2eX0B7q0wuI3yGqiBPhda8DPJp88LyB+NfOtCPfJd/wMahNaO5A6sXAhgW0geplA2AR8ftXP1kObFR8k9RHER86VTmV/OHWdjOBV0UXUXMPJp++vpS8hM0hwKaRBak1TgNeQTGfNU+muZf8jgduji5ChbuF5i5HNAPHNNbKH4nvpVeRG8gTk+oeW5E7XucR//qYduaPwBoUp8lzPz29wHZQvTyT+P2r3zgnXo18gPgdoqo8u6A2a4P/prmXfkwzchH5bu6idIB/12C7+slt5Btj1E5zyBMdR+9n/eRfJbRHbTTpkiXAL6ILqJADavNB7RPkiTWbeulH9Xcd8FRyR6Qo29PcMVg/Ji9Xp3ZaBPw0uog+bUKexqiVmtYhO4f8rXMYPJY8YH1YjQLfB94ZXYha7RbyuJRrCn7cPQp+vCodH12ASndcdAEDeEx0AWVpWodsjDy4f1i8LbqAIGsCJwLPjy5ErbYAeAblLF7c1IPGQuA30UWodKeRz5Q10Z7RBZSlaR0ygJOjC6jQs2nx6dlJbEZeV3Lf6ELUakvIg5v/UNLjN/UM2a/JHVW1293A76KL6JMdsho5keb27Hs1k7zw9bDYkXyAfGh0IWq1MeAllHe2fV3ggSU9dtl+Hl2AKtPUkxs7AmtHF1GGJnbI7gJ+GV1EhV7OcJwlexRwOnC/6ELUem8Djinx8R9Gc29C+XV0AapMUy9Nz6ClX9qb2CED+FF0ARUaAf4nuoiSHUD+cNgguhC13geBz5b8HE09WNxMOePpVE8XkW9qaaKmvsem1NQO2QkMz2VLgINo71mylwPHAnOjC1HrfQn43wqe5yEVPEcZfkee60nDIZHH6zZRU99jU2pqh+wu4JToIio0QjUHkip1gA8B3wRmBdei9jsaeGNFz9XUg0VZNziovs6KLqBPTX2PtdaLiZ81uMqMAbsV0nLxZgJfJr5NzXDkV8BsqjEDmF/BNpWRvUpoD9XbE4jf7/rJnTR3nGYrrUlzP/j6zZk0fydcjXynbHRbmuHInyh2fcrpbFnSdpSd5cBaJbSH6m1tmrss3aYltEeopl6yhHzZ8tjoIiq2J3BgdBEDWI98qXn/6EI0FC4n72vzK3zOrSt8riJdQT7roOEyD7gyuog+bRNdQNGa3CGDPP5o2HycZg6A34Y8XqG1k/qpVq4DnsR9l1rbrOTnbepB4uLoAhTmkugC+rR1dAFFa3qH7AzyN7thsjXwvugievQQ8mvV1Mky1Sy3Ak/mvutTPhg4rOTn3rrkxy+L010Mr6a+9k398jOppnfIEvCd6CICvBPYObqILj2B3BnbPLoQDYUF5HntVv3WvwV5ZvLFJT//1iU/flkujS5AYZr62m8dXUDRmt4hA/gWeUDqMJkFfIV8t2KdPQc4iZYuc6HaWQo8F/j9Kj9fnzx28X7Av0quoakrTVweXYDCXBZdQJ+2ii6gaG2Y/+l68lJKT40upGK7AocAn44uZAoXkhcJ3xTYBNiIPIZno1V+1ob9ULHGgJdx37UYVyNPJL3j+P+/qeQ6Niz58cuy6uVdDY9rowvoU+tWdmn6FAorPIXhXBR3AbALzR0DAHkf3JB7d9I2JnfcNhz/78bjad0bUIU5BDhilZ+NAD8F9lvpZ88Fjiuxjusp/8aBoi0H5gDLogtRiBFgIfW/4rKqa2nuGekJtaVD1iHfJbTjdL/YQheRJ4xdGF1IRdYlH/A2Hf/vuiv971V/puHwYeD9q/ysA3yDvDTXyvak3NnJF5I7N01yHXn+NA2vG2jeZ+ZC8hnw1mjLpaIEfAH4fHQhAXYCPga8JbqQitw+nulu05/L1J21FT/bAhgtq1iV7qvctzMG8Anu2xkDuLHEWlaneZ0xKP8yrurvRprXIZs7ntacjGjLGTLIPeVryZOPDpsEPJM8Vka9m8v0HbcVY9+adlq/zX5KvgS56qW2NwKfm+RvVidf6i/D1sBVJT12mU4D9okuQqF+DTw+uog+3I/mjoG7j7acIYP8Iftt4G3BdUToAF8nT4VxXXAtTbQQ+Md4pjKL3CnbhNxJW/kmhVV/tmZZxQrIB5Dncd/O2AuBz07yN3dSXmcMql2iqUi3RxegcE3dB5r6nptQmzpkkL8Vv5n2bVc3NiSfMXgs5R50htky8liLG7r43blM3HFb+e7Sbcg3K6g35wPP4r5zij2RPA3OZNP5lD3lRVMvfc+LLkDh7oguoE9NHCIwqbZ1XK4Gvge8NLiOKDsDR5Ev46TgWobdQvLlq8kuYY0Ap2KHrFdXkqe4WXXdxUcCP2HqTlGZ48cAZpf8+GW5O7oAhWvql/imfgmaUBsmhl3VRxi+iWJX9mzgA9FFaFpfAPaKLqJhbiCPdVp1EPr9gZ8x/eWLsjtkTT04LI0uQOGWRBfQp6a+5ybUxg7ZFcCx0UUEez95fI3q6a3Aq6OLaJjbyfMNrnrGcTPymcaNungMz5BNrKkHYxWnqftAU99zE2pjhwzyvERj0UUE6gBHAk+LLkT3sS95SgZ1byF5fcoLV/n52uSlubbu8nHK7pCNlPz4ZXFCWNkhq4G2dsguBk6MLiLYKHAMXharkwcCR9O+sZtlWgb8F3mB+pXNJb/HH97DY5XdIWvqUIm2HgfUvaZO59OqLxNtfiO+j+E+SwZ5braTgMdEFyLWAn4MrBNdSIMk4DXk8WErm0m+eeWxPT5e2R2ypp5laNU4HPWlqfvAqndaN1qbO2QXku+4HHark88kPCK6kCE2izyu8UHRhTTMO4FvTvDzzwDP6ePxyp72oqkdsqZealVx7JDVQJs7ZJAHt7fqBevTOuSBz7tEFzKkPoUzoffq4+R2W9WHyTPx96PsM2RN/axp1VxO6ktTx2I19UvQhNreIbsa+FJ0ETWxPvA7YP/oQobMy8iTFat7RwHvnuDnrwXe2+djLgdu6bui7jT14LB2dAEKt250AX1q6pegobUBeRbiZEjkQZBvGKhF1a09gUXEv+ZNyglMfNPDM8n7br+P283qCoN6wAD1ReakMhpDjfJz4vfDfrJdGY2hcr2L+B2nbvkK+U41lWNr4N/Ev85Nyu+YeJ/cm8E7tudP8LhFW3/AGqNyVhmNoUb5I/H7YT/xJqkGGgX+TvzOU7dcDDx4gHbVxNYA/kr869ukXMDEl00eQp4UdtDHr+Is0AwGO4sXlUvLaAw1yuXE74e9Zil5zk010D7E70B1zF3ACwdoV91bhzzXWPTr2qRcSV50fVXbku+MLOI5vjHB45fh5oLqrTKuZTncOuTJl6P3w15T9k06lWv7oP6VnUpefFj3tgZ5epDv0NyBnXXyYfJEpurOjeTVC1adkmJD8riWTQp8nircWtHzFGk1YL3oIhRmA5p5p20T32tTGqYOGcAhNHdV+7IdBPyN/uZ3UvYc4H+ii2iQO4Gnks+QrWxN4BfA9gU+V1UdsrLv5CzLFtEFKMyW0QX0qanvtUkNW4fsGuD/oouosY3JE5j+BNgmuJam2ZU8XYNjGrqzCHgG8OdVfj5K3gd3Lvj5quqQVXE3Zxl8vw+vpr72TX2vTWrYOmSQF3b+S3QRNXcAecD/B/FOzG5sSu7E2lbdWQ68gHxX5cpmkDu1+5bwnFV1yK6u6HmKtkN0AQrzwOgC+nR1dAFFG8YO2VLyZJ1Lg+uou7nAB4B/AofS3JmcyzaHvEbl5tGFNEQir0850XjOT1He+Luyl01a4eqKnqdoTT0oa3BNfe2vji5AxfkY8XeJNCmXk+/GnNlPY7fYUcS/Nk3KoZO043tLft41Jnneou1X8naUlT+U0RhqhKbOQfbkMhpDMebg3GT95ArgdXh5DnLnIvr1aFImWpsS4CXAWInPO3+S5y3DjiVuR5m5m4lXSFC7zSLf6Ba9//WTB5TQHgq0G3n9uegdq4m5CXgfE88fNQz2J4+Fin4dmpIjmfiGh6eThw+U+dyXT/C8ZZlLc/cLJ4kePg8lfr/rJ8twGE0rvYf4navJWQocT56+YBguZ64OPBeYR3zbNyU/A0YmaMtHk89elf38Z0zw3GW6rMDaq8xBZTSGau0VxO93/eSSMhpD8WaS7/aK3sHakGuAw8hTQLTJ1uQF2X9BM2e0jsyZ5IlHV/Vg8sSOVdRwzATPX6ZjC6y9yny+jMZQrX2J+P2unxxdRmOoHraimPXyzD25Cvgk+SxI086crU5eausw4ELi27KpuZCJV3/Ygnz3blV1HDFBDWX6QIG1V5kLymgM1dolxO93/eQ9ZTSG6uNA4neytuY28tQQbyAPeq6btYCnAR8n321W9pimYchVwGYTtPX6VH8QqPrD+1kF1l5lxsjL6Gg4bEi5N9OUmWeU0B6qmc8Qv6MNQ64nd9DeRx4cX+UcXmsDewNvA75L7hws62MbzOS5iYmXPVoN+H1APa+YoJYybVdg7VXnmSW0h+rpOcTvb/2mqasLTMllXu5tBPgtsEdwHcPo3+RLXFeTL2ddvdL/vp5851o3Rsnf/DYZz3bkiQ+3H8+WuN+X6S7g8cB5q/x8BPgpeZ6uqj0NOLnC5+uQO6UbVvicRfkyeVobtd/XgFdFF9GHW4CNyB2zVnHemXtbSp4p/HzyC67qbAQ8cYp/X0g+2N8F3DH+32Xj/zYy/vcbA+uVWKOmtph8hmXVzlgH+AoxnTGobtmkFRJwNnlKj6Z5Gvn1at3BTvfSIe79OKgzcf8cKo/H+cmM6SXLyJdAJvLJ4Noi5sp71wD1RuchJbSH6mUX4vezfvOOEtqjFoZxLctu/AZP20u9eCtw3AQ/fyOxH6BjwM0Bz/v7gOcsygHRBah0TTx7u8JZ0QUoxhHEfxswpu6Z7C7GFxI/a33VlytXmA0s6rLGusXpL9qvqdNdLCSPE9YQmgmcSPxOaExd8wUm9kTymLLo+v4ySX1VOGOKuuoel1Fqr6Yul5TIV69ay0uWU1sOvBi/MUoT+QHwpgl+/kjgJ9Tjm2zUGTLIKzs01fOjC1BpnhddwACa/J5SQTYjT3QZ/e3AmLrkNCZf3LdOZ4a+M0mNVdh5irrqnmtp3gobmt5M8hJ30ftXv2n1DSeeIevODeSldP4dXYhUA38iT2+xeJJ/X1RhLdO5IfC5/wz8K/D5B7EFsG90ESrcU8lzMTbRv4CLoosokx2y7l1BXq7h7uhCpECXkD/U50/xO3dVVEs3bgp87gScEvj8g2ripKGaWpNf05PJ76nWskPWmz8CT8FOmYbTdeTO2K3T/F6dOmTRZ6iqXCGgaM8A7hddhAqzDXni36Zq8nupK3bIencmefHgOl2Wkcp2C/kS1j+7+N07S66lF5GD+gF+RnO/wM0izyOndngzzR0XeBfw8+giymaHrD+nkpdYWhJdiHp2TnQBDTSf/M36b13+fp3OkEV3yBbQ7G/2rwHWii5CA1sLeHl0EQM4gTwHWavZIevficCBTD6wWfVzKvDu6CIaZgl5SaQ/9fA3dsju7ejoAgawFvDq6CI0sNcBa0cXMYAfRRegZngy+ZJE9O3AZuqcBMwBPlaDWpqS5fQ3Z9Eba1B7Ip+dqoM5wDzi26Pf3AisVnirqCqrk29uid6P+s088nuo9TxDNrhfkgf612ncjO7tm+Rxf7OBg4NraZK309/Znbq8F6IH9K+wiHxGvak2Bl4bXYT69kZgo+giBnA8jtlWj3Yjz1MW/W3C3JPlwDtXeo0+UoOampL/pX/PqkH9iXot8P0E4ttjkNwIrFl4q6hsawM3E7//DJLHFd4qGgoPAK4kfgc2eRzTASu9NtuO/yy6ribkiwzmSTXYhgQcN+B2FKkDXEZ8mwySDxfeKirbYcTvN4PkUvJ7R+rLxsC5xO/Iw5wLgB1Xek1m+5p0nWMYfCjDbjXYjgR8fsDtKNq7iG+TQbIA5yVrki1o/vjmdxTeKho6c4CjiN+ZhzFHct8ByF+sQV1NyK+YfH3KXuxYg21JwPsK2JYibUK+azW6XQbJdwtvFZXlB8TvL4NkMc0e+6Ya6QCHkscxRe/Yw5B5wAsmeB3qcsdf3XMOxY0R2qIG25Oo53QNxxHfLoNkjDweTvW2L/H7yqA5pvBW0dB7Os2+5b0JOYM8RmxVryQfQKLrq3v+Dmw4Qfv1a60abFMC9i9wm4ryGOLbZdBcxpBMQ9BQs8nv6ej9ZNDsXnTDSJAv4TR9QG8dcxfwJiYe8/QCYFkNaqx7rgO2mqD9BjGDenSEdy14u4pyNvFtM2g+VHirqChNH8ifqNcd0mqhdclrZFVcaQAAEFlJREFUcUXv6G3JicDWk7T1G/FScTe5FXjwJG04qDrc0bpFSds2qAOJb5tBsxR4VNENo4HtTju+iD6z6IaRVtUBDiFPche9wzc11wIHTdG+H6xBjU3IAvLls7LcELx9Y8Boids3iJnAFcTvA4Pmb8DcgttG/VuNPE1E9H4xaC7DSetVoUeQP8yid/wm5U7gvUx+APDO1u6zBNhvknYsSvSB4eaSt29QbbnZ5EtFN4z69lXi94ci8pqiG0aazlzgs9RjrE2dswT4CnnKgMlsDvyxBrU2IWPAy6Zoy6KcE7BtK+eC8jdxILOBa4jfH4rIiwpuG/XuecTvB0Xkaup7ZltD4Jm45NJEWQp8C7j/NO23F81eOLfqvGWa9izKryvcpolySvmbOLDXEL8/FJE7ge0Lbht1bwfqMWaziLyy4LaRerYu+SyQZ8vyGbEjyctQTWXFeLymT7RZZT4yTZsW6Sclbkc3Oar8TRzYCO1Zau3vwDrFNo+6sBZwMfGvfxG5HJhVbPNI/XsieaeMfmNE5BbgY8CWXbTT5sBvalBzk/JVql0TLno832Hlb2IhXk78vlFUfokH1CrNBE4i/nUvKi8utnmkwc0ld0yG5czPBeQZ1bu9W+tZ5M5bdN1Nyo/JH95Vil6u6s3lb2IhZtGeMxwJ+FyxzaMpfJ7417uoXED1n1FS1x5AXjoi+o1SRu4gX6LtZdqFtcf/Jrr2puU3xMyqHj055XPL38TCPJH4/aTIvKfY5tEEPkD861xk9i22eaRy7A2cT/wbZtAsAH4KPJ/eOwj7AdfXYBualvPJY0wivLfLGsvKQ8vfxEKdSPz+UlTGqOc6om3xWuJf4yJzfLHNI5VrBvBCmrc+2Tzg++SZyVfvY7s3Ab5Xg+1oYi4HNu69yQvz5knqqiLLaN5ai9vRrgmjx8gdBxXrFbRrFZLFTH8Dl1RLM8kDHy8h/o00UZaS1yD7EHk6in7nk5kBvA64vQbb1MTcAGzTc6sXK3Kw+mUVbF8ZPkX8vlNkllPNnHfD4pW0qzOWaM7NN9KkOsBTyHc1RU6VsQT4A3A4sD+wZgHb9nDasfhyVG6nHpfrnktcGxxdwfaVYU3aM1nsiiwH3lBkIw2pN9O+zthV9HflRKqtrYH3ARdR7ptn6fhzHAW8jTy2bbUCt2MN8hmCpSVvR5tT9vqUvdiXuHZ4WwXbV5b9iN+PyshhVDvtSlu0eX3e/YtrJql+NiEvofEJ8iDhK8gH6W7eHIuA64C/AL8Avgy8AzgA2JG81EsZOsALaN+ZgaqzFHh6j21fpt2Ja4s9Kti+Mv2A+P2pjHwTl8XpxWzgO8S/bmWkCRM3S6VYA9gWeAiwy0p5BHmsURGXGvvxaPIlz+gPh6anqvUpe7ETMW2xhO7ntKurDWjvcmq/Z+p1aZVtAPyO+NerjNwCbFRcU0kaxObkOcXaNiYiKu/orfkrcT9i2uKsKjauAi8ifr8qK/8EHlVcU7XO7sC1xL9OZeX5xTWVpH6tCXyY7i+jmunziZ5egeqsS0x7vK+KjatIm6d8WUoeGzWjqMZqgRXr8y4m/vUpK0cW1lqS+jIKHAzcSPwHQptyFPUdKD2LmDbZpYqNq8g6wNXE72dl5ufAFgW1V5NtCZxC/OtRZq4kbqJqaeiNAAcB/yD+w6BtOZH6L+Rc9ZnQm2jfGZfHkCe6jd7fysw88he2un65KNuBwG3Evw5lZinNv9lGaqQVKwtcTvwHQRtzOs0YuF71GdFvV7JV1fsw8ftcFfkV8KCC2qwJdgJ+TXy7V5H3F9RmknrwJOA84j8A2poLyOOzmqDqDvlzqtmsys0ETiV+36siS4BPky/XttW6wGcYnjkXT6Z9Z66l2uqQJ7Rs623adcmVwKZdviZ1cD7Vtc0dNOOsYb/WY7gu/d9Jnky2TWOOVgcOpf2XJ1fO1eQpPCSVbG3ympN/Jf6N3/bcCNy/u5elNn5Lde3z5Wo2KdSuwELi98Wq9/t30ZyzwhNZD/gf8hjH6PasMgvIS+FJKtEu5HnE7iL+TT8MmQfs3NUrUy8nUl0b7VnRNkV7JfH7Y0TuIl/m22HwJqzMjsARwHzi2y8iBw3ehJIm8gDyN9Wy18w0985C8rqhTfR9qmmjqxiuO/QOJ36/jMwZwEup5+XMtcmrZpxJfDtF5mMDtqOkVWxLnqhw2D9corIMeO60r1J9fZlq2umDFW1PXcwAjiV+/4zOIuAEcucscimejYGXAz8brym6XaLzQ4brC5JUijnAvsCngL8T/8Ye5owBr5r65aq9T1J+Oy0lL9M0bObiOrCrvl/+Qj57eAB5ebaybAE8k/w5+dfx547e/rrkDPJxRH2o+8SSKleHPM5hH+DJwF7AaqEVaYX3AF+PLmJAd1XwHMcB11TwPHWzkNzxOAvYLriWOugADxvP28d/9i9yh+lS4DLype0bgJvHs3SSxxoBNhzPZuQrBduP52E0607nKl1O7qguii5EaoJZ5AH5hwDHAP8m/huVuW8+P9kL2DBvpfy22r2yramnbYHriN9nm5il5Ckobh3PbQzP3GBF5xpgKzQQz5C12zr8//buLOTyuo7j+Hssx3YyLbOyEluQyLLVkqypCCKCIoQWkKiMumijLivqJoIg6CaoiFYoDKKF9ijKhRZBTcuLFlMxlLAmM01thi5+M2U2+5xz/s85/9cLPszDzDMPv/M753ue3/n/f8s4ruLsxhEsz2yz92raBF+s3jZ1IxbkliX//Esat+3m7A/VjsbpDQ+fuC3r5t6t93YaW8WfG3dYrp26IevOgGxzbKvOagy8nta4Eva4TK5cJ9+u3tD4xLkJln3L8oNL/vnr4reNX4g/bux5Bauys/Hau3rqhsBW8KTGKrPfNf1lazny/Kyxk/cmeWnL66+fr/BxrItnN/asm/q1LPPIzupZwcw9pvpQY5Lq1EUpR58r28wrG2e3vD57yQofxzp5euMW0tSvadns/KXxAQBm64XVVxv7U01dkLKYXNNyl+hP6YyW02ffXeWDWEOnVzc0/WtbNjM3Vk8OZujYxnEpVzZ9Icpic0ObvWXBqS2+z3a1nsdIrdqpzeswcllNrm2c2gKzckx1bmP/nKmLUBafPzfm/22yE1p8v31qpY9gvT22+k3Tv9ZlM3JVdUowI8dUr21sZjh1Acpy8tfqzDbf9hbbbzdXJ670Eay/46sfNf1rXtY7P2xsowSz8bTG3kpTF58sL/+ontd8LPJsvzeuuO2bYnv1uaZ/7ct65jONqTMwCyc2bsXsavrik+Xlluqc5mVRp0H8IHvqHY1tjX3bnLsoh5rd1XuDmdhWnd9YQjx18cly89fmuUx8ERPLr2ucK8jRe3njtTh1PcjWzi3Vq4KZOLn6ZtMXniw/f2kcWzVHl3d0fXdbNp9ctCc0JmhPXReyNXN1Y+sUmIVzGxOUpy48WX7mvmfPhR153+2qXrH6Js/CA6oLmr4+ZGvlS23eiSGwT8dXX2v6opPV5I+NqxFz9u2OvP/eNUF752Rb4yD725u+VmTa/KN6SzATT69+3/SFJ6vJFdWj4ssdWf/Zb2x1Tq8ua/qakWlyVfO+is/MvL26o+kLT1aTbzVuCVGf7PD77xvVvado7IwdV304K73nlN3Vx/Y897Dxjqs+2/SFJ6vLp7Nnz919tMPrvx9V95mkpVS9qPpd09eRLDe/rXYEM/HQ6qdNX3iymuyuPhD39IEOvQ9/Xj1wklZyd/dtPG93Nn1dyWJzV+OqmIn7zMaZ1fVNX3yymtxevS725d0dWh/+srHoha3jKdUvmr6+ZDG5rHpGMCM7qr81ffHJanJ989zw9VC9uYP34aXVQ6ZqIAd0THVedVPT15ocWW6u3lHdK5iRV2YJ+Zzyk+qkOJDXdOA+dGVsPRzfmPRvcdL65M7qE42j+WBW3poVSnPJrsYvJysBD+5l7b8fv5c5Y+vm9MYq4qlrUA6cb1RP3M9zCBvtTTm0dy65qXppHKpz2nc/fiGrUdfZWTn6bSvmour5B3jeYKO9OYOxueS7uUV5uJ7a//fjxxpzk1h/Zze2Kpm6Nueei6oXHuS5go32htymnEP+1pgUaxBx+E7rv/14R3X+tM1hSXY0bmX6cLq67G5cpTznEJ4f2Givz2BsDvlOdUocqYc1+vGG6jkTt4Xle3zjCuhtTV+7m5o7qs9XTzrE5wQ22nkZjG16rqteHUfrPtXF1clTN4SVenj1/uqPTV/Lm5Jrqvdl2gT8x44s/d7k3NZYQeksysXZPnUDmMwx1YurC/K+eSS5o3Fb8tzsIwb/48nZ9HVTc3v18dyehGU5qXpndUnmmh0ouxuT9N/eOIIPuIeTq2ubvlhlsfl7Y87LIwNW5ZTGQpmLMjjbm183zhA97ci7FTbf/RoHH09dsLK4XNr4hXBCwJROaszLvaDa2fTvDavKrdUPGu9Djz7qXmTtbZu6AWtgW/WV6lVTN4Sj8qfG5PKLq683JhsDW8v2xt5mL6me1zgM+7hJW7Q4/2x8ELyw+n7jveiuSVvElmJAdnDvqT4ydSM20O2NN6gatw3/1fjUuHPP393V+AR5NN97a3Vj9YcMwGAdHdcYlD23MVA7s/W5mnRtdXnjtuwljcHYnZO2iC3NgOzAXtC4pLyOZxb+szE42d/XB/v3ZX7v3tsSAIfrwdUZjUVWZzTO1zy1ekSr37x5d2OPvWuqq6tfVVfuyc4D/D/4PwZk+3d8dUX7XnW31QY4e7++rbFMGmButlePqR67Jyc15ojuzYl7/txWPaixjcSx/XeLm1sbV9t3Vbc0Bls37yM3Nq5+XdPYr9BVLxbCgGz/tlf33/P13ttkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADB3/wZRd0jXgvKzSwAAAABJRU5ErkJggg==';

const W = 595.28;
const H = 841.89;

const LEFT = 19;
const LEFT_W = 215;
const DIVIDER = 255;

const RIGHT = 265;
const RIGHT_W = 265;

const styles = StyleSheet.create({
  page: {
    padding: 0,
    margin: 0,
    backgroundColor: WHITE,
    fontFamily: "Helvetica",
  },

  frame: {
    position: "relative",
    width: W,
    height: H,
    border: `8px solid ${TEAL}`,
    backgroundColor: WHITE,
  },

  leftBg: {
    position: "absolute",
    left: LEFT,
    top: 0,
    width: LEFT_W,
    height: H - 16,
    backgroundColor: MINT,
  },

  divider: {
    position: "absolute",
    left: DIVIDER,
    top: 0,
    width: 1.1,
    height: H - 16,
    backgroundColor: "#25292C",
  },

  name: {
    fontSize: 23,
    fontWeight: 700,
    color: DARK,
  },

  title: {
    fontSize: 11.2,
    color: DARK,
    letterSpacing: 0.7,
  },

  heading: {
    fontSize: 15.2,
    fontWeight: 700,
    color: DARK,
  },

  leftText: {
    fontSize: 8.1,
    color: DARK,
  },

  leftSmall: {
    fontSize: 7.8,
    color: DARK,
  },

  leftBold: {
    fontSize: 9.2,
    fontWeight: 700,
    color: DARK,
  },

  piLabel: {
    fontSize: 9.5,
    color: MUTED,
  },

  piValue: {
    fontSize: 9.7,
    fontWeight: 700,
    color: DARK,
  },

  jobTitle: {
    fontSize: 9.1,
    fontWeight: 700,
    color: DARK,
  },

  jobDate: {
    fontSize: 7.8,
    fontWeight: 700,
    color: DARK,
    textAlign: "right",
  },

  jobCompany: {
    fontSize: 8,
    fontStyle: "italic",
    color: DARK,
  },

  jobDesc: {
    fontSize: 7.3,
    lineHeight: 1.25,
    color: DARK,
  },

  skill: {
    fontSize: 7.2,
    fontWeight: 700,
    color: DARK,
  },

  bullet: {
    fontSize: 8,
    fontWeight: 700,
    color: DARK,
  },

  line: {
    position: "absolute",
    height: 1,
    backgroundColor: "#303438",
  },
});

function box(left: number, top: number, width: number, height: number) {
  return {
    position: "absolute" as const,
    left,
    top,
    width,
    height,
  };
}

function clip(value: unknown, max: number) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text.length <= max
    ? text
    : `${text.slice(0, Math.max(1, max - 1)).trim()}…`;
}


/* ---------------- AUTO-FIT LEFT HEADER TEXT ---------------- */
function fitHeaderFontSize(
  value: string,
  maxSize: number,
  minSize: number,
  maxCharsAtMaxSize: number,
) {
  const length = value.trim().length;
  if (!length) return maxSize;

  // Approximate uppercase text width so long names/titles shrink
  // instead of being clipped or leaving the mint panel.
  const size = (maxSize * maxCharsAtMaxSize) / Math.max(length, 1);
  return Math.max(minSize, Math.min(maxSize, size));
}

/* ---------------- INLINE ICONS ---------------- */

type IconName =
  | "person"
  | "phone"
  | "web"
  | "location"
  | "education"
  | "references"
  | "about"
  | "job"
  | "skills"
  | "language"
  | "hobbies";

function IconArtwork({ name }: { name: IconName }) {
  const common = {
    fill: "none" as const,
    stroke: WHITE,
    strokeWidth: 3.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "person" || name === "about") {
    return (
      <>
        <Circle cx="32" cy="21" r="8" fill={WHITE} />
        <Path d="M16 49c2-10 8-16 16-16s14 6 16 16" fill={WHITE} />
      </>
    );
  }

  if (name === "phone") {
    return (
      <Path
        d="M19 13l10 7-5 8c4 7 9 12 17 16l8-5 7 10c-4 5-9 6-14 4-14-5-27-18-32-32-2-5 0-9 4-8z"
        fill={WHITE}
      />
    );
  }

  if (name === "web" || name === "language") {
    return (
      <>
        <Circle cx="32" cy="32" r="21" {...common} />
        <Path d="M11 32h42M32 11c7 7 7 35 0 42M32 11c-7 7-7 35 0 42" {...common} />
      </>
    );
  }

  if (name === "location") {
    return (
      <>
        <Path
          d="M32 55S17 40 17 27a15 15 0 1 1 30 0c0 13-15 28-15 28z"
          fill={WHITE}
        />
        <Circle cx="32" cy="27" r="5" fill={TEAL} />
      </>
    );
  }

  if (name === "education") {
    return (
      <>
        <Path d="M8 25l24-13 24 13-24 13z" fill={WHITE} />
        <Path d="M17 32v12c8 6 22 6 30 0V32L32 39z" fill={WHITE} />
        <Line x1="56" y1="27" x2="56" y2="43" stroke={WHITE} strokeWidth="4" />
      </>
    );
  }

  if (name === "references") {
    return (
      <>
        <Circle cx="23" cy="24" r="7" fill={WHITE} />
        <Circle cx="41" cy="24" r="7" fill={WHITE} />
        <Path d="M10 49c1-9 7-14 13-14s12 5 13 14M28 49c1-9 7-14 13-14s12 5 13 14" fill={WHITE} />
      </>
    );
  }

  if (name === "job") {
    return (
      <>
        <Rect x="11" y="20" width="42" height="29" rx="3" fill={WHITE} />
        <Path d="M24 20v-6h16v6" stroke={WHITE} strokeWidth="4" />
        <Path d="M11 30h42M27 30v7h10v-7" stroke={TEAL} strokeWidth="4" />
      </>
    );
  }

  if (name === "skills") {
    return (
      <>
        <Path d="M12 45l10-10 8 7 18-20 4 4-22 25-8-7-6 7z" fill={WHITE} />
        <Circle cx="49" cy="18" r="4" fill={WHITE} />
      </>
    );
  }

  return (
    <>
      <Circle cx="32" cy="32" r="21" fill="none" stroke={WHITE} strokeWidth="3" />
      <Path d="M18 32h28M32 18v28" stroke={WHITE} strokeWidth="3" />
    </>
  );
}

function IconBadge({
  name,
  x,
  y,
  size = 25,
}: {
  name: IconName;
  x: number;
  y: number;
  size?: number;
}) {
  return (
    <View style={box(x, y, size, size)}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Circle cx="32" cy="32" r="30" fill={TEAL} />
        {IconArtwork({ name })}
      </Svg>
    </View>
  );
}

function SectionHeading({
  icon,
  title,
  x,
  y,
  width,
}: {
  icon: IconName;
  title: string;
  x: number;
  y: number;
  width: number;
}) {
  return (
    <>
      <IconBadge name={icon} x={x} y={y} size={25} />
      <View style={box(x + 33, y + 2, width - 33, 24)}>
        <Text style={styles.heading}>{title}</Text>
      </View>
    </>
  );
}

export default function CvPdfDocument({
  data,
  showWatermark,
}: {
  data: CvData;
  showWatermark: boolean; // true = subtle logo watermark; false = no logo
}) {
  const jobs = data.workExperience;
  const education = data.education;
  const references = data.references;
  const skills = data.skills;
  const languages = data.languages;
  const hobbies = data.hobbies;

  /* RIGHT COLUMN — fixed sections */
  const PI_TOP = 49;
  const PI_ROWS_TOP = 84;
  const PI_ROW_H = 14.5;

  const JOB_TOP = 285;
  const JOB_ROWS_TOP = 322;
  const JOB_ENTRY_H = 44;

  const SKILLS_TOP = 482;
  const SKILLS_ROWS_TOP = 518;
  const SKILL_ROW_H = 21;

  const BOTTOM_TOP = 625;
  const BOTTOM_ROWS_TOP = 662;
  const BOTTOM_ROW_H = 22;

  const personalRows: [string, string][] = [
    ["Father's Name", data.fatherName],
    ["Mother's Name", data.motherName],
    ["Permanent Address", data.permanentAddress],
    ["Present Address", data.presentAddress],
    ["Date of Birth", data.dateOfBirth],
    ["Religion", data.religion],
    ["Nationality", data.nationality],
    ["Marital Status", data.maritalStatus],
    ["Sex", data.sex],
    ["Blood Group", data.bloodGroup],
    ["Passport Number", data.passportNumber],
    ["Passport Issue", data.passportIssue],
    ["Passport Expiry", data.passportExpiry],
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.frame}>
          <View style={styles.leftBg} />
          <View style={styles.divider} />
          {showWatermark && (
            <Image
              src={CV_LOGO_DATA_URI}
              style={{
                position: "absolute",
                left: 160,
                top: 185,
                width: 445,
                height: 350,
                objectFit: "contain",
                opacity: 0.02,
              }}
            />
          )}

          {/* ================= LEFT COLUMN ================= */}

<View
  style={{
    ...box(19, 50, 215, 30),
    alignItems: "center",
    justifyContent: "center",
  }}
>
  <Text
    wrap={false}
    style={{
      ...styles.name,
      textAlign: "center",
      fontSize: fitHeaderFontSize(
        (data.fullName || "YOUR NAME").toUpperCase(),
        23,
        9.5,
        11,
      ),
    }}
  >
    {(data.fullName || "YOUR NAME").toUpperCase()}
  </Text>
</View>

<View
  style={{
    ...box(19, 81, 215, 20),
    alignItems: "center",
    justifyContent: "center",
  }}
>
  <Text
    wrap={false}
    style={{
      ...styles.title,
      textAlign: "center",
      fontSize: fitHeaderFontSize(
        (data.jobTitle || "PROFESSIONAL").toUpperCase(),
        11.2,
        7.5,
        28,
      ),
    }}
  >
              {(data.jobTitle || "PROFESSIONAL").toUpperCase()}
            </Text>
          </View>

          <View style={box(54, 116, 145, 145)}>
            {data.photo ? (
              <Image
                src={data.photo}
                style={{
                  width: 145,
                  height: 145,
                  borderRadius: 999,
                  objectFit: "cover",
                  border: "5px solid #FFFFFF",
                }}
              />
            ) : (
              <View
                style={{
                  width: 145,
                  height: 145,
                  borderRadius: 999,
                  backgroundColor: "#B8DCD8",
                  border: "5px solid #FFFFFF",
                }}
              />
            )}
          </View>

          <IconBadge name="person" x={61} y={298} />
          <View style={box(94, 300, 125, 24)}>
            <Text style={{ ...styles.heading, textAlign: "center" }}>CONTACT ME</Text>
          </View>

          <IconBadge name="phone" x={61} y={337} size={14} />
          <View style={box(81, 335, 125, 17)}>
            <Text style={{ ...styles.leftText, textAlign: "center" }}>{clip(data.phone, 18)}</Text>
          </View>

          <IconBadge name="web" x={61} y={360} size={14} />
          <View style={box(81, 358, 125, 17)}>
            <Text style={{ ...styles.leftText, textAlign: "center" }}>{clip(data.email, 28)}</Text>
          </View>

          <IconBadge name="location" x={61} y={383} size={14} />
          <View style={box(81, 381, 125, 29)}>
            <Text style={{ ...styles.leftText, textAlign: "center" }}>{clip(data.presentAddress, 32)}</Text>
          </View>

          <View style={{ ...styles.line, left: 52, top: 435, width: 149 }} />

          <IconBadge name="education" x={64} y={441} />
          <View style={box(97, 443, 125, 24)}>
            <Text style={{ ...styles.heading, textAlign: "center" }}>EDUCATION</Text>
          </View>

          <View style={box(39, 482, 175, 18)}>
            <Text style={{ ...styles.leftBold, textAlign: "center" }}>
              {clip(education[0]?.institution, 26)}
            </Text>
          </View>
          <View style={box(39, 502, 175, 17)}>
            <Text style={{ ...styles.leftSmall, textAlign: "center" }}>
              {clip(education[0]?.level, 28)}
            </Text>
          </View>
          <View style={box(39, 520, 175, 17)}>
            <Text style={{ ...styles.leftSmall, textAlign: "center" }}>
              {clip(education[0]?.year, 14)}
            </Text>
          </View>

          <View style={box(39, 547, 175, 18)}>
            <Text style={{ ...styles.leftBold, textAlign: "center" }}>
              {clip(education[1]?.institution, 26)}
            </Text>
          </View>
          <View style={box(39, 567, 175, 17)}>
            <Text style={{ ...styles.leftSmall, textAlign: "center" }}>
              {clip(education[1]?.level, 28)}
            </Text>
          </View>
          <View style={box(39, 585, 175, 17)}>
            <Text style={{ ...styles.leftSmall, textAlign: "center" }}>
              {clip(education[1]?.year, 14)}
            </Text>
          </View>

          <View style={{ ...styles.line, left: 52, top: 627, width: 149 }} />

          <IconBadge name="references" x={60} y={633} />
          <View style={box(93, 635, 128, 24)}>
            <Text style={{ ...styles.heading, textAlign: "center" }}>REFERENCES</Text>
          </View>

          <View style={box(39, 673, 175, 18)}>
            <Text style={{ ...styles.leftBold, textAlign: "center" }}>
              {clip(references[0]?.name, 22)}
            </Text>
          </View>
          <View style={box(39, 693, 175, 16)}>
            <Text style={{ ...styles.leftSmall, textAlign: "center" }}>
              {clip(references[0]?.phone ? `Tel: ${references[0].phone}` : "", 25)}
            </Text>
          </View>
          <View style={box(39, 711, 175, 16)}>
            <Text style={{ ...styles.leftSmall, textAlign: "center" }}>
              {clip(references[0]?.email, 26)}
            </Text>
          </View>

          <View style={box(39, 737, 175, 18)}>
            <Text style={{ ...styles.leftBold, textAlign: "center" }}>
              {clip(references[1]?.name, 22)}
            </Text>
          </View>
          <View style={box(39, 757, 175, 16)}>
            <Text style={{ ...styles.leftSmall, textAlign: "center" }}>
              {clip(references[1]?.phone ? `Tel: ${references[1].phone}` : "", 25)}
            </Text>
          </View>
          <View style={box(39, 775, 175, 16)}>
            <Text style={{ ...styles.leftSmall, textAlign: "center" }}>
              {clip(references[1]?.email, 26)}
            </Text>
          </View>

          {/* ================= RIGHT: PERSONAL INFORMATION ================= */}

          <SectionHeading
            icon="about"
            title="PERSONAL INFORMATION"
            x={RIGHT}
            y={PI_TOP}
            width={RIGHT_W}
          />

          {personalRows.map(([label, value], i) => (
            <View
              key={label}
              style={{
                ...box(RIGHT + 1, PI_ROWS_TOP + i * PI_ROW_H, RIGHT_W - 2, PI_ROW_H),
                flexDirection: "row",
              }}
            >
              <Text style={{ ...styles.piLabel, width: 105 }}>{label}</Text>
              <Text style={{ ...styles.piValue, width: RIGHT_W - 107 }}>
                {clip(value, 32)}
              </Text>
            </View>
          ))}

          <View style={{ ...styles.line, left: RIGHT, top: 278, width: RIGHT_W }} />

          {/* ================= RIGHT: JOB EXPERIENCE ================= */}

          <SectionHeading
            icon="job"
            title="JOB EXPERIENCE"
            x={RIGHT}
            y={JOB_TOP}
            width={RIGHT_W}
          />

          {[0, 1, 2].map((i) => {
            const job = jobs[i];
            const top = JOB_ROWS_TOP + i * JOB_ENTRY_H;

            return (
              <View key={i}>
                <View style={box(RIGHT + 1, top, 165, 13)}>
                  <Text style={styles.jobTitle}>
                    {clip(job?.position, 29).toUpperCase()}
                  </Text>
                </View>

                <View style={box(RIGHT + 168, top, 77, 13)}>
                  <Text style={styles.jobDate}>
                    {clip(job ? `${job.startDate} - ${job.endDate}` : "", 14)}
                  </Text>
                </View>

                <View style={box(RIGHT + 1, top + 14, 238, 13)}>
                  <Text style={styles.jobCompany}>
                    {clip(job?.company, 30)}
                  </Text>
                </View>

                <View style={box(RIGHT + 1, top + 27, 238, 17)}>
                  <Text style={styles.jobDesc}>
                    {clip(job?.description, 120)}
                  </Text>
                </View>
              </View>
            );
          })}

          <View style={{ ...styles.line, left: RIGHT, top: 445, width: RIGHT_W }} />

          {/* ================= RIGHT: SKILLS ================= */}

          <SectionHeading
            icon="skills"
            title="SKILLS"
            x={RIGHT}
            y={451}
            width={RIGHT_W}
          />

          {[0, 1, 2, 3, 4].map((i) => {
            const skill = skills[i];
            if (!skill?.name) return null;

            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = col === 0 ? RIGHT + 1 : RIGHT + 125;
            const y = SKILLS_ROWS_TOP + row * SKILL_ROW_H;

            return (
              <View key={skill.id || i}>
                <View style={box(x, y, 61, 12)}>
                  <Text style={styles.skill}>{clip(skill.name, 20)}</Text>
                </View>

                <View
                  style={{
                    position: "absolute",
                    left: x + 65,
                    top: y + 2,
                    width: 42,
                    height: 7,
                    border: "0.8px solid #60676A",
                    borderRadius: 4,
                    backgroundColor: WHITE,
                  }}
                >
                  <View
                    style={{
                      position: "absolute",
                      left: 1,
                      top: 1,
                      height: 3.5,
                      borderRadius: 2,
                      backgroundColor: TEAL,
                      width: `${Math.min(5, Math.max(1, skill.level)) * 20}%`,
                    }}
                  />
                </View>
              </View>
            );
          })}

          <View style={{ ...styles.line, left: RIGHT, top: 619, width: RIGHT_W }} />

          {/* ================= RIGHT: LANGUAGE + HOBBIES ================= */}

          <SectionHeading
            icon="language"
            title="LANGUAGE"
            x={RIGHT}
            y={BOTTOM_TOP}
            width={126}
          />

          <SectionHeading
            icon="hobbies"
            title="HOBBIES"
            x={RIGHT + 132}
            y={BOTTOM_TOP}
            width={113}
          />

          {[0, 1, 2, 3].map((i) => {
            const lang = languages[i];
            if (!lang?.name) return null;

            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = col === 0 ? RIGHT : RIGHT + 63;
            const y = BOTTOM_ROWS_TOP + row * BOTTOM_ROW_H;

            return (
              <View key={lang.id || i} style={box(x, y, 61, BOTTOM_ROW_H)}>
                <Text style={styles.bullet}>
                  • {clip(lang.name, 14).toUpperCase()}
                </Text>
              </View>
            );
          })}

          {[0, 1, 2].map((i) => {
            const hobby = hobbies[i];
            if (!hobby) return null;

            return (
              <View
                key={i}
                style={box(RIGHT + 126, BOTTOM_ROWS_TOP + i * BOTTOM_ROW_H, 118, BOTTOM_ROW_H)}
              >
                <Text style={styles.bullet}>
                  • {clip(hobby, 22).toUpperCase()}
                </Text>
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
}
