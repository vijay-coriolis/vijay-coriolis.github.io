const MODEL_FILE_URL = `${MlDataLocation}/tensorflowjs_model.pb`;
const WEIGHT_MANIFEST_FILE_URL = `${MlDataLocation}/weights_manifest.json`;
const ML_THRESHOLD = 0.8;

const MODEL_FILE = `${MlDataLocation}model.json`;


const IMAGENET_CLASSES = {
    0: 'dropbox',
    1: 'facebook',
    2: 'google',
    3: 'paypal'
};

// const INPUT_NODE_NAME = 'Placeholder';
// const OUTPUT_NODE_NAME = 'final_result';
// const PREPROCESS_DIVISOR = tf.scalar(255);

var mobilenet;
var classifier;

class Classification {
    constructor() {
        //Classifier initialization
        const options = { version: 1, epochs: 20, numLabels: 5, batchSize: 0.5 };
        mobilenet = ml5.featureExtractor('MobileNet', options, this.modelReady);
        classifier = mobilenet.classification(this.classifierReady);
        classifier.load('./model/model.json', this.customclassifier);
    }

    // Change the status when the model loads.
    modelReady() {
        console.log('Model loaded');
    }

    customclassifier() {
        console.log("custom classifier is loaded");
    }

    classifierReady() {
        console.log("classifier is loaded");
        //If you want to load a pre-trained model at the start
    }

    // load tensorflow model and weights
    async load() {
        console.log("ML Data loading..");
        this.model = await tf.loadFrozenModel(
            MODEL_FILE_URL,
            WEIGHT_MANIFEST_FILE_URL);
    }

    dispose() {
        if (this.model) {
            this.model.dispose();
        }
    }

    predict(image) {
            let input = tf.fromPixels(image, 3)
            const preInput = tf.cast(input, 'float32');
            const dims_expander = tf.expandDims(preInput, 0);
            const resized = tf.image.resizeBilinear(dims_expander, [224, 224]);
            const preprocessedInput = tf.div(tf.sub(resized, tf.scalar(0)), tf.scalar(255));
            return this.model.execute({
                [INPUT_NODE_NAME]: preprocessedInput
            }, OUTPUT_NODE_NAME);
        }
        // load image to get Image object
    loadImage(imageUrl) {
        console.log("loadImage");
        return new Promise((resolve, reject) => {
            let image = new Image();
            image.onload = () => {
                resolve(image);
            };
            image.onerror = () => {
                reject("Error: Unable to load image");
            };
            image.src = imageUrl;
        });
    }

    //
    findMlMatches(res, screenshot) {
        console.time('ML Match Time');
        console.log("findMLMAtches");
        return new Promise((resolve, reject) => {
            if (res != null) {
                resolve(res);
            }
            this.loadImage(screenshot).then(image => {
        console.log("classify");

                classifier.classify(image, function(err, result) {
        console.log("classified");

                    if (err) {
                        console.log(err);
                    } else {
                        console.timeEnd('ML Match Time');
                        resolve(result)
                    }
                });
            });
        });
    }

    getTopKClasses(logits, topK) {
        const predictions = logits;
        const values = predictions.dataSync();
        predictions.dispose();
        let predictionList = [];
        for (let i = 0; i < values.length; i++) {
            predictionList.push({ value: values[i], index: i });
        }
        predictionList = predictionList
            .sort((a, b) => {
                return b.value - a.value;
            })
            .slice(0, topK);
        console.log(predictionList);
        let site = predictionList[0];
        let result = { type: 'custom', site: IMAGENET_CLASSES[site.index] }
        console.log('ML Result: Site: %s, Probability: %i%', result.site, (site.value * 100));
        if (site.value > ML_THRESHOLD) {
            return result;
        } else {
            return null;
        }
    }
}